export function makeSandboxResp(payload: Record<string, unknown>, ms: number) {
  const q = String(payload.query ?? 'item').trim() || 'item';
  const mp = Math.max(1, parseInt(String(payload.max_pages ?? '10')) || 10);
  const cap = q.charAt(0).toUpperCase() + q.slice(1);
  const suffix = ['Pro Max 256GB', 'RTX 4060', 'Ultra 5G', 'Edição Gamer', 'Plus 512GB', 'Lite'];
  const items = Array.from({ length: 5 }, (_, i) => ({
    mlb_id: 'MLB' + (3900000000 + Math.floor(Math.random() * 99999999)),
    title: cap + ' ' + suffix[i % suffix.length],
    price: Math.round((400 + Math.random() * 8000) * 100) / 100,
    currency: 'BRL',
    available_quantity: 1 + Math.floor(Math.random() * 40),
    sold_quantity: Math.floor(Math.random() * 900),
    seller: {
      id: 100000000 + Math.floor(Math.random() * 99999999),
      reputation: ['green', 'yellow', 'green', 'green', 'green'][i],
      is_official: Math.random() > 0.6,
    },
    rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
    collected_at: new Date().toISOString(),
  }));
  return {
    sandbox: true,
    ms: 320 + mp * 38 + Math.floor(Math.random() * 140),
    shown: items.length,
    total: mp * 48,
    items,
    payload,
  };
}
