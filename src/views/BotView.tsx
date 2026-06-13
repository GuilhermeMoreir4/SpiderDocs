import { useState, useEffect, useRef, useCallback } from 'react';
import type { BotMeta, SectionData } from '../types';
import { statusInfo } from '../utils/status';
import { Sidebar } from '../components/Sidebar';
import { RunConsole } from '../components/RunConsole';
import { MarkdownDoc } from '../components/MarkdownDoc';

interface Props {
  botName: string;
  onNavigate: (path: string) => void;
  refreshSignal: number;
}

export function BotView({ botName, onNavigate, refreshSignal }: Props) {
  const [meta, setMeta] = useState<BotMeta>({ name: botName });
  const [doc, setDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeId, setActiveId] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSections([]);
    setActiveId('');
    setDoc(null);

    const [m, d] = await Promise.all([
      fetch(`/api/bots/${encodeURIComponent(botName)}/meta`).then(r => r.json()).catch(() => ({})) as Promise<BotMeta>,
      fetch(`/api/bots/${encodeURIComponent(botName)}/doc`).then(r => r.ok ? r.text() : null).catch(() => null),
    ]);

    setMeta({ ...m, name: botName });
    setDoc(d);
    setLoading(false);
  }, [botName]);

  useEffect(() => { load(); }, [load, refreshSignal]);

  // Scroll spy
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || sections.length === 0) return;

    let raf: number | null = null;

    function update() {
      raf = null;
      if (!container) return;
      const ct = container.getBoundingClientRect().top;
      let found = '';
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top - ct <= 92) found = sec.id;
        else if (found) break;
      }
      setActiveId(found);
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections]);

  function scrollToId(id: string) {
    const container = scrollRef.current;
    const target = document.getElementById(id);
    if (!container || !target) return;
    const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 18;
    container.scrollTo({ top, behavior: 'smooth' });
  }

  function scrollToConsole() {
    scrollToId('run-console');
  }

  const s = statusInfo(meta.status);

  const sidebarStatus = (
    <span className="inline-flex items-center gap-[7px] font-sans font-medium text-[12px] leading-none text-[#9aa6b8]">
      <span className="w-2 h-2 rounded-full flex-none" style={{ background: s.dot }} />
      serviço <span className="text-[#e7edf5] font-semibold">{s.pt}</span>
    </span>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex">
      <Sidebar
        botName={botName}
        version={meta.version}
        status={sidebarStatus}
        sections={sections}
        activeId={activeId}
        onScrollTo={scrollToId}
        onScrollToConsole={scrollToConsole}
        onNavigateBack={() => onNavigate('/')}
      />

      <div ref={scrollRef} className="scr-main flex-1 overflow-y-auto relative">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-[rgba(246,247,249,0.9)] backdrop-blur-[10px] border-b border-surface-300 h-[54px] px-10 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2 font-sans font-medium text-[13px] text-[#7a8499]">
            <button
              onClick={() => onNavigate('/')}
              className="text-ink-100 bg-transparent border-none cursor-pointer font-sans font-medium text-[13px] hover:text-brand transition-colors"
            >
              bots
            </button>
            <span className="text-[#c3c9d4]">/</span>
            <span className="text-ink-600 font-mono">{botName}</span>
            <span className="text-[#c3c9d4]">/</span>
            <span className="text-ink-100">doc.md</span>
          </div>
          <div className="flex items-center gap-3.5">
            {meta.lastRun && (
              <span className="font-sans text-[12.5px] text-ink-300">última execução · {meta.lastRun}</span>
            )}
            <span
              className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full font-semibold text-[12px]"
              style={{ background: s.bg, border: `1px solid ${s.br}`, color: s.fg }}
            >
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: s.dot }} />
              {s.pt}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-[892px] mx-auto px-12 pt-[38px] pb-[140px]">
          {/* Hero */}
          <div className="mb-[30px]">
            <div className="font-sans font-semibold text-[11px] tracking-[.16em] uppercase text-ink-100 mb-3">Documentação do Bot</div>
            <h1 className="font-mono font-semibold text-[40px] leading-[1.08] tracking-[-0.025em] text-navy-800 mb-4 break-words">{botName}</h1>
            <div className="flex flex-wrap">
              {meta.language && <MetaChip label="runtime"  value={meta.language} color="#5a4ad6" />}
              {meta.schedule && <MetaChip label="schedule" value={meta.schedule} color="#c0820f" />}
              {meta.version  && <MetaChip label="versão"   value={meta.version}  color="#0f9d6e" />}
              <span
                className="inline-flex items-center gap-2 px-3 py-[7px] rounded-[9px] border font-sans font-medium text-[12.5px] mr-2 mb-2"
                style={{ background: s.bg, border: `1px solid ${s.br}`, color: s.fg }}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: s.dot }} />
                {s.pt}
              </span>
            </div>
          </div>

          {/* Run console */}
          <RunConsole botName={botName} meta={meta} />

          {/* Markdown */}
          {loading && (
            <div className="flex items-center gap-3 text-ink-300 font-sans text-[14px] py-10">
              <Spinner /> Renderizando doc.md…
            </div>
          )}
          {!loading && doc === null && (
            <div className="text-center py-20 text-ink-300">
              <h2 className="font-semibold text-[20px] text-ink-600 mb-2">doc.md não encontrado</h2>
              <p className="font-sans text-[14px]">
                Adicione um arquivo <code className="font-mono text-[13px]">doc.md</code> nesta pasta do bot.
              </p>
            </div>
          )}
          {!loading && doc !== null && (
            <MarkdownDoc key={botName} md={doc} onSections={setSections} />
          )}
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-[7px] rounded-[9px] bg-white border border-[#e6e8ee] font-sans font-medium text-[12.5px] mr-2 mb-2">
      <span className="font-semibold text-[10px] tracking-[.1em] uppercase text-ink-100">{label}</span>
      <span className="font-mono font-semibold" style={{ color }}>{value}</span>
    </span>
  );
}

function Spinner() {
  return (
    <span className="w-[22px] h-[22px] rounded-full border-[2.5px] border-surface-300 border-t-emerald animate-spin inline-block flex-none" />
  );
}
