export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
}

/** parseFloat with a fallback for anything non-finite. */
export function num(v: unknown, fallback: number): number {
  const n = parseFloat(v as string);
  return isFinite(n) ? n : fallback;
}

/** One decimal place, dropped when it is .0. */
export function fmt(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error('Missing element #' + id);
  return el as T;
}
