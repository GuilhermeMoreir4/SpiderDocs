import { useState, useEffect } from 'react';
import type { BotMeta, BotParam, RunResult } from '../types';
import { makeSandboxResp } from '../utils/sandbox';
import { esc, hlJSON } from '../utils/markdown';

interface Props {
  botName: string;
  meta: BotMeta;
}

type Tab = 'resp' | 'stderr' | 'payload';

interface RunState {
  running: boolean;
  result: RunResult | null;
  tab: Tab;
}

export function RunConsole({ botName, meta }: Props) {
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [payloadStr, setPayloadStr] = useState('{}');
  const [run, setRun] = useState<RunState>({ running: false, result: null, tab: 'resp' });

  useEffect(() => {
    const obj: Record<string, unknown> = {};
    if (meta.params?.length) {
      meta.params.forEach(p => { if (p.default !== undefined) obj[p.name] = p.default; });
    }
    setPayload(obj);
    setPayloadStr(JSON.stringify(obj));
    setRun({ running: false, result: null, tab: 'resp' });
  }, [botName, meta]);

  const hasRunner = Boolean(meta.run);

  async function execute() {
    if (run.running) return;
    setRun(s => ({ ...s, running: true, result: null }));
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(payloadStr || '{}'); } catch { body = {}; }
    const start = Date.now();
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(botName)}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as RunResult;
      if (res.ok) {
        setRun({ running: false, result: { ...data, ms: data.ms || Date.now() - start, payload: body }, tab: 'resp' });
      } else if (res.status === 422) {
        setRun({ running: false, result: { ...makeSandboxResp(body, Date.now() - start), payload: body }, tab: 'resp' });
      } else {
        setRun({ running: false, result: { error: (data as { error?: string }).error, ms: Date.now() - start }, tab: 'resp' });
      }
    } catch (e) {
      setRun({ running: false, result: { error: (e as Error).message, ms: Date.now() - start }, tab: 'resp' });
    }
  }

  function updateParam(p: BotParam, value: unknown) {
    const updated = { ...payload, [p.name]: value };
    setPayload(updated);
    setPayloadStr(JSON.stringify(updated));
  }

  return (
    <section id="run-console" className="border border-[#cfe6d9] rounded-2xl bg-white mb-6 overflow-hidden shadow-[0_1px_2px_rgba(20,30,50,.03)] scroll-mt-[84px]">
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-[#e9f1ec]"
        style={{ background: 'linear-gradient(180deg,#f3fbf7,#fff)' }}
      >
        <span className="font-mono font-semibold text-[11px] tracking-[.08em] text-emerald bg-emerald-bg px-2.5 py-1.5 rounded-[7px] flex-none">RUN</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[16.5px] leading-[1.2] text-ink-800 tracking-[-0.01em]">Executar bot</div>
          <div className="text-[12.5px] leading-[1.35] text-ink-200 mt-0.5">
            Preencha o payload e execute o bot em tempo real — como o "Try it out" do Swagger
          </div>
        </div>
        <span
          className="font-sans text-[11px] font-medium py-1.5 px-2.5 rounded-full flex-none"
          style={hasRunner
            ? { color: '#0f9d6e', background: '#e3f6ee', border: '1px solid #bfe9d6' }
            : { color: '#7a8499', background: '#f1f3f6', border: '1px solid #e6e8ee' }}
        >
          {hasRunner ? 'live' : 'sandbox'}
        </span>
      </div>

      <div className="px-5 py-4 pb-5">
        {meta.params?.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            {meta.params.map(p => (
              <ParamField key={p.name} param={p} value={payload[p.name]} onChange={v => updateParam(p, v)} />
            ))}
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-ink-200 mb-1.5">Payload JSON</div>
            <textarea
              className="w-full min-h-[100px] font-mono text-[13px] leading-[1.6] text-[#c9d4e3] bg-[#0d1117] border border-[#1c2433] rounded-[10px] p-3.5 outline-none resize-y"
              value={payloadStr}
              onChange={e => setPayloadStr(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-4">
          <button
            disabled={run.running}
            onClick={execute}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border-none cursor-pointer bg-emerald text-white font-semibold text-[13.5px] shadow-[0_8px_18px_-10px_rgba(15,157,110,.8)] transition-[background,opacity] duration-150 disabled:bg-emerald-muted disabled:cursor-default"
          >
            {run.running ? <><Spinner /> Coletando…</> : <><span className="text-[10px]">▶</span> Executar</>}
          </button>
          <button
            onClick={() => setRun({ running: false, result: null, tab: 'resp' })}
            className="px-4 py-2.5 rounded-[10px] border border-surface-400 bg-white text-ink-400 font-semibold text-[13.5px] cursor-pointer hover:bg-surface-50 transition-[background] duration-150"
          >
            Limpar
          </button>
        </div>

        {run.result && (
          <ResponsePanel
            result={run.result}
            tab={run.tab}
            onTab={t => setRun(s => ({ ...s, tab: t }))}
          />
        )}
      </div>
    </section>
  );
}

function ParamField({ param, value, onChange }: { param: BotParam; value: unknown; onChange: (v: unknown) => void }) {
  const fullWidth = param.type === 'string' || param.type === 'select';
  const inputCls = 'w-full px-3 py-2 border border-surface-400 rounded-[9px] font-mono font-medium text-[13.5px] text-ink-700 bg-white outline-none transition focus:border-emerald focus:ring-2 focus:ring-[rgba(15,157,110,.12)]';

  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-ink-200 mb-1.5">
        {param.name}{param.required && <span className="text-danger ml-0.5">*</span>}
      </div>
      {param.type === 'select' && param.options ? (
        <select
          value={String(value ?? param.default ?? '')}
          onChange={e => onChange(e.target.value)}
          className={`${inputCls} appearance-none cursor-pointer`}
        >
          {param.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : param.type === 'boolean' ? (
        <Toggle value={Boolean(value ?? param.default)} onChange={onChange} />
      ) : (
        <input
          type={param.type === 'number' ? 'number' : 'text'}
          value={String(value ?? param.default ?? '')}
          placeholder={param.placeholder ?? param.name}
          onChange={e => onChange(param.type === 'number' ? Number(e.target.value) : e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: unknown) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative w-11 h-[25px] rounded-full border-none cursor-pointer transition-[background] duration-150 flex-none"
        style={{ background: value ? '#0f9d6e' : '#cfd4dd' }}
      >
        <span
          className="absolute top-[3px] w-[19px] h-[19px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-[left] duration-150"
          style={{ left: value ? '22px' : '3px' }}
        />
      </button>
      <span className="font-mono font-semibold text-[13px]" style={{ color: value ? '#0f9d6e' : '#9aa3b5' }}>
        {value ? 'true' : 'false'}
      </span>
    </div>
  );
}

function ResponsePanel({ result, tab, onTab }: { result: RunResult; tab: Tab; onTab: (t: Tab) => void }) {
  if (result.error) {
    return (
      <div className="mt-4 px-4 py-3.5 bg-danger-bg border border-danger-border rounded-[10px] text-danger font-medium text-[13.5px] leading-[1.4]">
        <strong>Erro:</strong> {result.error}
      </div>
    );
  }

  const hasTabs = result.stdout !== undefined;
  const tabs: [Tab, string][] = hasTabs
    ? [['resp', 'Saída (stdout)'], ['stderr', 'Stderr'], ['payload', 'Payload']]
    : [['resp', 'Resposta'], ['payload', 'Payload']];

  const isSuccess = !result.error && (result.exitCode === 0 || result.exitCode === undefined);

  let rawText = '';
  let displayHtml = '';
  let lang = '';

  if (tab === 'payload') {
    rawText = JSON.stringify(result.payload, null, 2);
    displayHtml = hlJSON(result.payload);
    lang = 'json · request';
  } else if (tab === 'stderr') {
    rawText = result.stderr ?? '';
    displayHtml = esc(rawText);
    lang = 'bash · stderr';
  } else if (result.items) {
    rawText = JSON.stringify(result.items, null, 2);
    displayHtml = hlJSON(result.items);
    lang = 'json · response';
  } else {
    rawText = result.stdout ?? '';
    displayHtml = esc(rawText);
    lang = 'text · stdout';
  }

  return (
    <div className="mt-4">
      <div className="flex gap-1 border-b border-[#e6e8ee]">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`px-3.5 py-2 border-none bg-transparent cursor-pointer font-semibold text-[12.5px] border-b-2 -mb-px transition-colors duration-100 ${tab === id ? 'text-emerald border-b-emerald' : 'text-ink-200 border-b-transparent'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap py-3">
        <span
          className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full font-semibold text-[12px]"
          style={{
            background: isSuccess ? '#e3f6ee' : '#fbe7e7',
            border: `1px solid ${isSuccess ? '#bfe9d6' : '#f2c5c5'}`,
            color: isSuccess ? '#0f9d6e' : '#d23f3f',
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: isSuccess ? '#34d399' : '#f87171' }} />
          {result.exitCode !== undefined
            ? result.exitCode === 0 ? '0 OK' : `exit ${result.exitCode}`
            : '200 OK'}
        </span>
        <span className="font-mono text-[12.5px] font-medium text-ink-200">{result.ms} ms</span>
        {result.sandbox && (
          <>
            <span className="text-[12.5px] text-ink-200">
              {result.shown} itens nesta amostra · ~{result.total?.toLocaleString('pt-BR') ?? '?'} estimados
            </span>
            <span className="text-[11px] font-medium text-amber bg-amber-bg border border-amber-border px-2 py-1 rounded-[6px]">sandbox</span>
          </>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-[#1c2433] bg-[#0d1117]">
        <div className="flex justify-between items-center px-3 py-2 bg-[#11161f] border-b border-[#1c2433]">
          <span className="font-mono font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#6b7689]">{lang}</span>
          <CopyBtn text={rawText} />
        </div>
        <pre className="m-0 p-4 overflow-x-auto max-h-[360px] bg-[#0d1117]">
          <code
            className="font-mono text-[12.5px] leading-[1.65] text-[#c9d4e3] bg-transparent border-none p-0"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </pre>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }).catch(() => {});
      }}
      className="font-sans text-[11.5px] font-medium text-[#9aa6b8] bg-[#1a2230] border border-[#283142] rounded-[7px] px-2.5 py-1.5 cursor-pointer transition hover:text-white hover:bg-[#232d3e] hover:border-[#3a465c]"
    >
      {copied ? 'copiado ✓' : 'copiar'}
    </button>
  );
}

function Spinner() {
  return (
    <span className="w-[18px] h-[18px] rounded-full border-[2.5px] border-[rgba(255,255,255,.4)] border-t-white animate-spin inline-block flex-none" />
  );
}
