import { useRef, useEffect } from 'react';
import { marked } from 'marked';
import type { SectionData } from '../types';
import { buildSections, decorateCode } from '../utils/markdown';

interface Props {
  md: string;
  onSections: (sections: SectionData[]) => void;
}

export function MarkdownDoc({ md, onSections }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onSections);
  cbRef.current = onSections;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const html = marked.parse(md) as string;
    el.innerHTML = html;

    const sections = buildSections(el);
    decorateCode(el);

    cbRef.current(sections);
  }, [md]);

  return <div ref={ref} className="md-body" />;
}
