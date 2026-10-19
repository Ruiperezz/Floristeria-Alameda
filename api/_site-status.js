export const STATUS_KEY = 'site:status';

const MAX_MESSAGE = 300;
const MINUTE = 60_000;
const YEAR = 366 * 24 * 60 * MINUTE;

export function parseStatus(raw) {
  if (!raw) return null;
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return s && typeof s === 'object' ? s : null;
  } catch { return null; }
}

function ts(v) {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

export function evaluate(s, now = Date.now()) {
  if (!s || s.closed !== true) return { state: 'open' };
  const from = ts(s.from);
  const until = ts(s.until);
  if (until !== null && now >= until) return { state: 'open', expired: true };
  if (from !== null && now < from) return { state: 'scheduled' };
  return { state: 'closed' };
}

export function publicView(s, now = Date.now()) {
  const { state } = evaluate(s, now);
  const base = { state, closed: state === 'closed', now: new Date(now).toISOString() };
  if (state === 'open') return base;
  return {
    ...base,
    from: s.from || null,
    until: s.until || null,
    message: s.message || '',
    showContact: s.showContact !== false,
  };
}

export function buildStatus(input, now = Date.now()) {
  const updatedAt = new Date(now).toISOString();
  if (!input || input.closed !== true) return { value: { closed: false, updatedAt } };

  let from = null;
  if (input.from) {
    from = ts(input.from);
    if (from === null) return { error: 'La fecha de inicio del cierre no es válida' };
    if (from <= now + MINUTE) from = null;
    else if (from > now + YEAR) return { error: 'La fecha de inicio está demasiado lejos' };
  }

  let until = null;
  if (input.until) {
    until = ts(input.until);
    if (until === null) return { error: 'La fecha de reapertura no es válida' };
    const start = from ?? now;
    if (until <= start + MINUTE) return { error: 'La fecha de reapertura debe ser posterior al inicio del cierre' };
    if (until > start + YEAR) return { error: 'La fecha de reapertura está demasiado lejos' };
  }

  const message = typeof input.message === 'string' ? input.message.trim().slice(0, MAX_MESSAGE) : '';
  return {
    value: {
      closed: true,
      from: from === null ? null : new Date(from).toISOString(),
      until: until === null ? null : new Date(until).toISOString(),
      message,
      showContact: input.showContact !== false,
      updatedAt,
    },
  };
}

export async function kvGetStatus(url, token) {
  const r = await fetch(`${url}/get/${STATUS_KEY}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`KV get failed: ${r.status}`);
  const d = await r.json();
  return parseStatus(d?.result);
}

export async function kvSetStatus(url, token, value) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', STATUS_KEY, JSON.stringify(value)]),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error || d.result !== 'OK') throw new Error(d.error || `KV set failed: ${r.status}`);
}
