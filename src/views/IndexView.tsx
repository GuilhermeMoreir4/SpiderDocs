import { useState, useEffect, useCallback } from 'react';
import type { Bot, ConfigInfo } from '../types';
import { BotCard } from '../components/BotCard';

interface Props {
  onNavigate: (path: string) => void;
  refreshSignal: number;
}

export function IndexView({ onNavigate, refreshSignal }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botsDir, setBotsDir] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, cfg] = await Promise.all([
        fetch('/api/bots').then(r => r.json()) as Promise<Bot[]>,
        fetch('/api/config').then(r => r.json()) as Promise<ConfigInfo>,
      ]);
      setBots(data);
      setBotsDir(cfg.botsDir);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = async () => {
    if (!editValue.trim()) return;
    setConfigSaving(true);
    setConfigError(null);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botsDir: editValue.trim() }),
      });
      const data = await res.json() as ConfigInfo & { error?: string };
      if (!res.ok) {
        setConfigError(data.error ?? 'Erro desconhecido.');
      } else {
        setBotsDir(data.botsDir);
        setEditing(false);
        setConfigError(null);
        load();
      }
    } catch (e) {
      setConfigError((e as Error).message);
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => { load(); }, [load, refreshSignal]);

  const filtered = search
    ? bots.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.description ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : bots;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-navy-900 text-[#e7edf5] min-h-[58px] h-auto flex items-center justify-between px-8 border-b border-navy-500 flex-none flex-wrap gap-y-2 py-2">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-sans font-semibold text-[11.5px] tracking-[.16em] uppercase text-[#7e8a9c]">Scrapper · Docs</span>
        </div>

        <div className="flex flex-col items-start gap-1">
          {!editing ? (
            <button
              onClick={() => { setEditValue(botsDir); setEditing(true); setConfigError(null); }}
              className="flex items-center gap-1.5 font-mono text-[11.5px] text-[#4f5a6c] hover:text-brand-light transition-colors group"
              title="Alterar diretório de bots"
            >
              <span className="truncate max-w-[340px]">{botsDir || '…'}</span>
              <PencilIcon />
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveConfig(); if (e.key === 'Escape') setEditing(false); }}
                  className="font-mono text-[12px] text-[#e7edf5] bg-navy-400 border border-navy-200 rounded-[7px] px-2.5 py-1.5 outline-none w-[300px] focus:border-brand-light focus:ring-1 focus:ring-brand-muted"
                  placeholder="/caminho/para/bots"
                />
                <button
                  disabled={configSaving}
                  onClick={saveConfig}
                  className="px-3 py-1.5 rounded-[7px] font-sans font-semibold text-[12px] bg-brand text-white border-none cursor-pointer hover:bg-brand-light transition-colors disabled:opacity-50"
                >
                  {configSaving ? '…' : 'OK'}
                </button>
                <button
                  onClick={() => { setEditing(false); setConfigError(null); }}
                  className="px-2.5 py-1.5 rounded-[7px] font-sans text-[12px] text-[#7e8a9c] bg-navy-300 border border-navy-200 cursor-pointer hover:text-[#e7edf5] transition-colors"
                >
                  ✕
                </button>
              </div>
              {configError && (
                <span className="font-sans text-[11px] text-danger">{configError}</span>
              )}
            </div>
          )}
        </div>

        {!loading && (
          <span className="font-sans text-[12.5px] text-[#4f5a6c]">
            {bots.length} bot{bots.length !== 1 ? 's' : ''} encontrado{bots.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div className="px-8 pt-8 max-w-[1100px] mx-auto w-full">
        <div className="font-sans font-semibold text-[11px] tracking-[.16em] uppercase text-ink-100 mb-3">Bots Disponíveis</div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h1 className="font-mono font-semibold text-[34px] leading-[1.1] tracking-[-0.02em] text-navy-800">Documentação</h1>
          <input
            placeholder="Filtrar bots…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3.5 py-2 border border-surface-400 rounded-[9px] font-sans text-[13.5px] text-ink-700 bg-white outline-none w-60 focus:border-brand-light focus:ring-2 focus:ring-brand-muted transition"
          />
        </div>
      </div>

      <div
        className="p-8 max-w-[1100px] mx-auto w-full grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}
      >
        {loading && (
          <div className="flex items-center gap-3 text-ink-300 font-sans text-[14px] py-10">
            <Spinner /> Descobrindo bots…
          </div>
        )}
        {error && (
          <div className="col-span-full text-center py-20 text-ink-300">
            <h2 className="font-semibold text-[20px] text-ink-600 mb-2">Erro ao carregar</h2>
            <p className="font-sans text-[14px]">{error}</p>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-ink-300">
            <h2 className="font-semibold text-[20px] text-ink-600 mb-2">Nenhum bot encontrado</h2>
            <p className="font-sans text-[14px]">
              Adicione pastas com um arquivo <code className="font-mono text-[13px]">doc.md</code> no diretório de bots.
            </p>
          </div>
        )}
        {filtered.map(b => (
          <BotCard
            key={b.name}
            bot={b}
            onClick={() => onNavigate(`/bot/${encodeURIComponent(b.name)}`)}
          />
        ))}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      className="w-7 h-7 rounded-[7px] flex items-center justify-center font-mono font-bold text-[14px] text-white shadow-[0_4px_12px_-4px_rgba(124,131,255,.7)] flex-none"
      style={{ background: 'linear-gradient(140deg,#7c83ff,#4a52e0)' }}
    >
      S
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-[22px] h-[22px] rounded-full border-[2.5px] border-surface-300 border-t-emerald animate-spin inline-block flex-none" />
  );
}

function PencilIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 16 16" fill="none"
      className="opacity-0 group-hover:opacity-100 transition-opacity flex-none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H2v-3L11.5 2.5z" />
    </svg>
  );
}
