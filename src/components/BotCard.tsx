import type { Bot } from '../types';
import { statusInfo } from '../utils/status';

interface Props {
  bot: Bot;
  onClick: () => void;
}

export function BotCard({ bot, onClick }: Props) {
  const s = statusInfo(bot.status);

  return (
    <a
      href={`#/bot/${encodeURIComponent(bot.name)}`}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="block bg-white border border-[#e6e8ee] rounded-2xl p-5 cursor-pointer no-underline text-inherit transition-[box-shadow,border-color] duration-150 hover:shadow-[0_8px_28px_-16px_rgba(20,30,50,0.2)] hover:border-[#c9cdf7]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono font-semibold text-[16px] text-navy-800 break-all">{bot.name}</div>
        <span
          className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full font-semibold text-[11px]"
          style={{ background: s.bg, border: `1px solid ${s.br}`, color: s.fg }}
        >
          <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: s.dot }} />
          {s.pt}
        </span>
      </div>
      <div className="text-[#6b778c] text-[13.5px] leading-[1.6] mb-3 line-clamp-2">
        {bot.description || 'Sem descrição.'}
      </div>
      <div>
        {bot.language && <Chip label="runtime"  value={bot.language} color="#5a4ad6" />}
        {bot.schedule && <Chip label="schedule" value={bot.schedule} color="#c0820f" />}
        {bot.version  && <Chip label="versão"   value={bot.version}  color="#0f9d6e" />}
      </div>
    </a>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-[7px] bg-surface-100 border border-[#e6e8ee] text-ink-400 text-[11.5px] font-medium mr-1.5 mb-1.5">
      <span className="font-semibold text-[9.5px] uppercase tracking-[.1em] text-ink-100">{label}</span>
      <span className="font-mono font-semibold" style={{ color }}>{value}</span>
    </span>
  );
}
