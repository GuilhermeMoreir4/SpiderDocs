import type { SectionData } from '../types';

const CAT_MAP: [RegExp, string, string, string][] = [
  [/vis(ã|a)o|geral|overview|sobre|introdu/,   'INFO',     '#5b6678', '#eef0f4'],
  [/fonte|source|site|alvo|target|host/,         'SOURCE',   '#2563c9', '#e7eefb'],
  [/par(â|a)metro|input|entrada|argument/,       'INPUT',    '#5a4ad6', '#ece9fb'],
  [/schema|sa(í|i)da|output|dado|field|campo/,   'OUTPUT',   '#0f9d6e', '#e3f6ee'],
  [/agend|schedul|cron|frequ/,                   'SCHEDULE', '#c0820f', '#fbf1d8'],
  [/config|ambiente|env|setup|instal|vari/,      'CONFIG',   '#0e8aa6', '#e0f3f7'],
  [/erro|error|falha|fail|retry|except/,         'ERRORS',   '#d23f3f', '#fbe7e7'],
  [/auth|login|credencial|token|chave/,          'AUTH',     '#8a3fd2', '#f1e7fb'],
  [/exemplo|example|uso|usage|execu/,            'USAGE',    '#0c8f8f', '#dff4f4'],
  [/changelog|hist(ó|o)ric|vers(ã|a)o/,          'CHANGELOG','#5b6678', '#eef0f4'],
];

function catFor(text: string): { label: string; fg: string; bg: string } {
  const t = (text || '').toLowerCase();
  for (const [re, label, fg, bg] of CAT_MAP) {
    if (re.test(t)) return { label, fg, bg };
  }
  return { label: 'SECTION', fg: '#5b6678', bg: '#eef0f4' };
}

export function slugify(s: string): string {
  return (s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c),
  );
}

export function hlJSON(value: unknown): string {
  let json = JSON.stringify(value, null, 2);
  json = json.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));
  return json.replace(
    /("(?:\\.|[^"\\])*"\s*:?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    m => {
      let color = '#e0af68';
      if (/^"/.test(m)) color = /:\s*$/.test(m) ? '#7aa2f7' : '#9ece6a';
      else if (/^(true|false|null)$/.test(m)) color = '#ff9e64';
      return `<span style="color:${color}">${m}</span>`;
    },
  );
}

export function buildSections(body: HTMLElement): SectionData[] {
  const kids = Array.from(body.children) as HTMLElement[];
  const intro: HTMLElement[] = [];
  const groups: { head: HTMLElement; items: HTMLElement[] }[] = [];
  let cur: { head: HTMLElement; items: HTMLElement[] } | null = null;

  for (const el of kids) {
    if (el.tagName === 'H2') {
      cur = { head: el, items: [] };
      groups.push(cur);
    } else if (cur) {
      cur.items.push(el);
    } else {
      intro.push(el);
    }
  }

  body.innerHTML = '';

  if (intro.length) {
    const lead = document.createElement('div');
    lead.className = 'md-intro';
    intro.forEach(n => lead.appendChild(n));
    body.appendChild(lead);
  }

  const sections: SectionData[] = [];

  groups.forEach(g => {
    const title = g.head.textContent ?? '';
    const id = slugify(title);
    const cat = catFor(title);

    const card = document.createElement('section');
    card.className = 'op-card';
    card.id = id;
    card.dataset['title'] = title;
    card.dataset['dot'] = cat.fg;

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'op-head';
    head.innerHTML = `<span class="op-badge" style="color:${cat.fg};background:${cat.bg}">${cat.label}</span><span class="op-title">${esc(title)}</span><span class="op-chevron">▼</span>`;
    head.addEventListener('click', () => card.classList.toggle('collapsed'));

    const inner = document.createElement('div');
    inner.className = 'op-body';

    const subItems: { id: string; label: string }[] = [];

    g.items.forEach(n => {
      if (n.tagName === 'H3') {
        const subId = id + '--' + slugify(n.textContent ?? '');
        n.id = subId;
        subItems.push({ id: subId, label: n.textContent ?? '' });
      }
      inner.appendChild(n);
    });

    card.appendChild(head);
    card.appendChild(inner);
    body.appendChild(card);

    sections.push({ id, title, dot: cat.fg, subItems });
  });

  return sections;
}

export function decorateCode(body: HTMLElement): void {
  body.querySelectorAll<HTMLPreElement>('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const cls = (code?.className) ?? '';
    const m = cls.match(/language-([\w+-]+)/);
    const lang = m ? m[1] : 'text';

    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';

    const bar = document.createElement('div');
    bar.className = 'code-bar';

    const lab = document.createElement('span');
    lab.className = 'code-lang';
    lab.textContent = lang;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = 'copiar';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(code?.textContent ?? '').then(() => {
        btn.textContent = 'copiado ✓';
        setTimeout(() => { btn.textContent = 'copiar'; }, 1400);
      }).catch(() => {});
    });

    bar.appendChild(lab);
    bar.appendChild(btn);
    pre.parentNode?.insertBefore(wrap, pre);
    wrap.appendChild(bar);
    wrap.appendChild(pre);

    if (code) {
      import('highlight.js').then(({ default: hljs }) => {
        try { hljs.highlightElement(code); } catch {}
      });
    }
  });
}
