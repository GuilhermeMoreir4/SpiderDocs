import { useEffect, useRef } from 'react';

export function LiveBadge({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 0) return;
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '1';
    const t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div
      ref={ref}
      style={{ opacity: 0, transition: 'opacity 0.3s' }}
      className="fixed bottom-[18px] right-[18px] px-3 py-1.5 rounded-full font-sans text-[11.5px] font-medium bg-emerald-bg text-emerald border border-emerald-border pointer-events-none z-50"
    >
      ⟳ Atualizado
    </div>
  );
}
