import { WISH_COLORS, WISH_ICONS } from '@/config';

export type WishColor = (typeof WISH_COLORS)[number];
export type WishIcon = (typeof WISH_ICONS)[number];
export type Wish = {
  id: string;
  text: string;
  color: WishColor;
  icon: WishIcon;
  device_id: string;
  created_at: string;
};
export type NewWish = Pick<Wish, 'text' | 'color' | 'icon' | 'device_id'>;

const safe = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} },
};

export function getDeviceId(): string {
  let id = safe.get('wk.device');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    safe.set('wk.device', id);
  }
  return id;
}

export const getLastWish = () => Number(safe.get('wk.lastWish') || 0);
export const setLastWish = (t = Date.now()) => safe.set('wk.lastWish', String(t));

/** Wishes written while offline or without a backend; flushed when Supabase is reachable. */
export function getPending(): Wish[] {
  try { return JSON.parse(safe.get('wk.pending') || '[]'); } catch { return []; }
}
export const setPending = (w: Wish[]) => safe.set('wk.pending', JSON.stringify(w.slice(-50)));

/** Stable per-wish tilt in [-3, 3] degrees. */
export function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 61) - 30) / 10;
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
