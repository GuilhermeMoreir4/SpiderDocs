#!/usr/bin/env node
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let botsDir = path.resolve(args[0] || '.');
const PORT = parseInt(process.env.PORT || '3737');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

app.use(express.json());
const distDir = path.join(__dirname, 'dist');
if (existsSync(distDir)) app.use(express.static(distDir));

function isValidBotName(name) {
  return /^[a-zA-Z0-9_\-.]+$/.test(name) && !name.includes('..');
}

function readBotConfig(botName) {
  const p = path.join(botsDir, botName, 'bot.json');
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}

function extractDescription(docContent) {
  const lines = docContent.split('\n').map(l => l.trim());
  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('|') || line.startsWith('-') || line.startsWith('```')) continue;
    return line.replace(/\*\*([^*]+)\*\*/g, '$1').slice(0, 140);
  }
  return '';
}

function discoverBots() {
  if (!existsSync(botsDir)) return [];
  return readdirSync(botsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(path.join(botsDir, e.name, 'doc.md')))
    .map(e => {
      const cfg = readBotConfig(e.name);
      if (!cfg.description) {
        try {
          const doc = readFileSync(path.join(botsDir, e.name, 'doc.md'), 'utf-8');
          cfg.description = extractDescription(doc);
        } catch {}
      }
      return { name: e.name, ...cfg };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── API ────────────────────────────────────────────────────────────────────────

app.get('/api/bots', (_req, res) => {
  res.json(discoverBots());
});

app.get('/api/bots/:bot/doc', async (req, res) => {
  const { bot } = req.params;
  if (!isValidBotName(bot)) return res.status(400).json({ error: 'Invalid bot name' });
  const p = path.join(botsDir, bot, 'doc.md');
  if (!existsSync(p)) return res.status(404).json({ error: 'doc.md not found' });
  res.type('text/plain').send(await readFile(p, 'utf-8'));
});

app.get('/api/bots/:bot/meta', (req, res) => {
  const { bot } = req.params;
  if (!isValidBotName(bot)) return res.status(400).json({ error: 'Invalid bot name' });
  if (!existsSync(path.join(botsDir, bot))) return res.status(404).json({ error: 'Not found' });
  res.json(readBotConfig(bot));
});

app.post('/api/bots/:bot/run', (req, res) => {
  const { bot } = req.params;
  if (!isValidBotName(bot)) return res.status(400).json({ error: 'Invalid bot name' });
  const botDir = path.join(botsDir, bot);
  if (!existsSync(botDir)) return res.status(404).json({ error: 'Bot not found' });

  const cfg = readBotConfig(bot);
  let runCmd = cfg.run || null;

  if (!runCmd) {
    if (existsSync(path.join(botDir, 'main.py')))    runCmd = 'python main.py';
    else if (existsSync(path.join(botDir, 'index.js'))) runCmd = 'node index.js';
    else if (existsSync(path.join(botDir, 'main.js')))  runCmd = 'node main.js';
  }

  if (!runCmd) {
    return res.status(422).json({ error: 'No run command found. Add a bot.json with "run": "python main.py"' });
  }

  const payload = req.body || {};
  const payloadStr = JSON.stringify(payload);
  const parts = runCmd.split(/\s+/);
  const [cmd, ...cmdArgs] = parts;

  const start = Date.now();
  let done = false;

  const proc = spawn(cmd, [...cmdArgs, '--payload', payloadStr], {
    cwd: botDir,
    env: { ...process.env, BOT_PAYLOAD: payloadStr },
    timeout: 60000,
  });

  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', d => {
    stdout += d.toString();
    if (stdout.length > 500_000) proc.kill('SIGTERM');
  });
  proc.stderr.on('data', d => {
    stderr += d.toString();
    if (stderr.length > 500_000) proc.kill('SIGTERM');
  });
  proc.on('close', code => {
    if (done) return; done = true;
    res.json({ exitCode: code, ms: Date.now() - start, stdout, stderr });
  });
  proc.on('error', err => {
    if (done) return; done = true;
    res.status(500).json({ error: err.message });
  });
});

app.get('/api/config', (_req, res) => {
  res.json({ botsDir });
});

app.post('/api/config', (req, res) => {
  const { botsDir: newDir } = req.body;
  if (typeof newDir !== 'string' || !newDir.trim())
    return res.status(400).json({ error: 'Campo botsDir é obrigatório.' });
  const resolved = path.resolve(newDir.trim());
  if (!existsSync(resolved))
    return res.status(400).json({ error: `Diretório não encontrado: ${resolved}` });
  botsDir = resolved;
  startWatcher(botsDir);
  res.json({ botsDir });
});

// Fallback: serve index.html for all non-API routes (SPA)
app.get('*', (_req, res) => {
  const index = path.join(distDir, 'index.html');
  if (existsSync(index)) res.sendFile(index);
  else res.status(503).send('Run "npm run build" first.');
});

// ── WebSocket / live reload ────────────────────────────────────────────────────

const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  for (const c of clients) {
    if (c.readyState === 1) c.send(json);
  }
}

// ── File watcher ───────────────────────────────────────────────────────────────

let watcher = null;

function startWatcher(dir) {
  if (watcher) watcher.close();
  watcher = chokidar.watch(dir, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: 3,
  });
  watcher
    .on('change',    f => broadcast({ type: 'change',    rel: path.relative(dir, f) }))
    .on('add',       f => broadcast({ type: 'add',       rel: path.relative(dir, f) }))
    .on('unlink',    f => broadcast({ type: 'unlink',    rel: path.relative(dir, f) }))
    .on('addDir',    d => broadcast({ type: 'addDir',    rel: path.relative(dir, d) }))
    .on('unlinkDir', d => broadcast({ type: 'unlinkDir', rel: path.relative(dir, d) }));
}

startWatcher(botsDir);

server.listen(PORT, () => {
  console.log(`\n\x1b[35m🕷️  Scrapper Docs\x1b[0m`);
  console.log(`   \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`   Watching: \x1b[2m${botsDir}\x1b[0m\n`);
});
