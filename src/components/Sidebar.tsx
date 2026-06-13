import { useState } from 'react';
import type { SectionData } from '../types';

interface Props {
  botName: string;
  version?: string;
  status: React.ReactNode;
  sections: SectionData[];
  activeId: string;
  onScrollTo: (id: string) => void;
  onScrollToConsole: () => void;
  onNavigateBack: () => void;
}

export function Sidebar({
  botName, version, status, sections, activeId,
  onScrollTo, onScrollToConsole, onNavigateBack,
}: Props) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  return (
    <aside className="w-[298px] flex-none bg-navy-900 text-[#e7edf5] flex flex-col border-r border-navy-500 overflow-hidden">
      {/* Top */}
      <div className="px-[18px] py-5 pb-3.5 border-b border-navy-600 flex-none">
        <div className="flex items-center gap-2 mb-3.5">
          <Logo />
          <span className="font-sans font-semibold text-[11px] tracking-[.16em] uppercase text-[#7e8a9c]">Scrapper · Docs</span>
        </div>
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-1.5 font-sans text-[11.5px] font-medium text-[#5a6678] bg-transparent border-none cursor-pointer mb-3 transition-colors hover:text-[#aeb8c7] p-0"
        >
          <span className="text-[10px]">◀</span> Todos os bots
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[16px] leading-[1.25] text-white tracking-[-0.01em] break-all">{botName}</span>
        </div>
        <div className="mt-2.5">{status}</div>
      </div>

      {/* Search */}
      <div className="px-4 py-3.5 pb-2.5 flex-none">
        <div className="relative">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#5a6678] text-[13px] pointer-events-none">⌕</span>
          <input
            placeholder="Buscar na documentação"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-navy-700 border border-navy-300 rounded-[9px] py-[9px] pl-[30px] pr-3 text-[#e7edf5] font-sans text-[13px] outline-none"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="scr-nav flex-1 overflow-y-auto px-3.5 pb-6 pt-0.5">
        <div className="font-sans font-semibold text-[10.5px] tracking-[.14em] uppercase text-[#5a6678] px-3 pt-1.5 pb-2">Sandbox</div>
        <button
          onClick={onScrollToConsole}
          className={`flex items-center gap-2 w-full px-3 py-[7px] rounded-[8px] font-sans font-medium text-[13.5px] leading-[1.35] text-[#aeb8c7] cursor-pointer bg-transparent border-none transition-[background,color] duration-100 hover:bg-navy-700 hover:text-[#e7edf5] ${activeId === '__console' ? 'bg-navy-400 !text-white' : ''}`}
        >
          <span className="w-[7px] h-[7px] rounded-full flex-none bg-emerald" />
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">▶ Executar bot</span>
        </button>

        {sections.length > 0 && (
          <div className="font-sans font-semibold text-[10.5px] tracking-[.14em] uppercase text-[#5a6678] px-3 pt-[18px] pb-2">Seções</div>
        )}

        {sections.map(sec => {
          const visible = !q || sec.title.toLowerCase().includes(q);
          if (!visible) return null;
          return (
            <div key={sec.id}>
              <button
                onClick={() => onScrollTo(sec.id)}
                className={`flex items-center gap-2 w-full px-3 py-[7px] rounded-[8px] font-sans font-medium text-[13.5px] leading-[1.35] cursor-pointer bg-transparent border-none transition-[background,color] duration-100 hover:bg-navy-700 hover:text-[#e7edf5] relative ${activeId === sec.id ? 'bg-navy-400 !text-white' : 'text-[#aeb8c7]'}`}
              >
                {activeId === sec.id && (
                  <span className="absolute left-[-10px] top-[6px] bottom-[6px] w-[3px] rounded-[2px] bg-brand-light" />
                )}
                <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: sec.dot }} />
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">{sec.title}</span>
              </button>
              {sec.subItems.map(sub => {
                const subVisible = !q || sub.label.toLowerCase().includes(q);
                if (!subVisible) return null;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onScrollTo(sub.id)}
                    className={`block w-full text-left px-3 py-[5px] pl-[30px] font-sans text-[12.5px] leading-[1.3] rounded-[7px] cursor-pointer bg-transparent border-none transition-[color,background] duration-100 hover:text-[#cdd5e2] hover:bg-navy-700 ${activeId === sub.id ? 'text-[#aeb6ff]' : 'text-[#7e8a9c]'}`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-[18px] py-3.5 border-t border-navy-600 flex items-center justify-between flex-none">
        <span className="font-mono font-medium text-[11.5px] text-[#6b7689]">{version ?? ''}</span>
        <span className="font-sans text-[11.5px] text-[#4f5a6c]">doc.md</span>
      </div>
    </aside>
  );
}

function Logo() {
  return (
    <div
      className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center font-mono font-bold text-[13px] text-white shadow-[0_4px_12px_-4px_rgba(124,131,255,.7)] flex-none"
      style={{ background: 'linear-gradient(140deg,#7c83ff,#4a52e0)' }}
    >
      S
    </div>
  );
}
