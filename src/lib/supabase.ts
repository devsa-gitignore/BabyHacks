import type { SupabaseClient } from '@supabase/supabase-js';
import { WISH_PAGE_SIZE } from '@/config';
import type { NewWish, Wish } from './wishes';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasBackend = Boolean(URL && KEY);

let client: Promise<SupabaseClient> | null = null;
function getClient() {
  if (!client) {
    client = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL as string, KEY as string, { realtime: { params: { eventsPerSecond: 5 } } }),
    );
  }
  return client;
}

export async function fetchWishes(page = 0): Promise<Wish[]> {
  if (!hasBackend) return [];
  const sb = await getClient();
  const from = page * WISH_PAGE_SIZE;
  const { data, error } = await sb
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, from + WISH_PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []) as Wish[];
}

export async function countWishes(): Promise<number | null> {
  if (!hasBackend) return null;
  const sb = await getClient();
  const { count, error } = await sb.from('wishes').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export type InsertResult = { ok: true; wish: Wish } | { ok: false; rateLimited: boolean };

export async function insertWish(w: NewWish): Promise<InsertResult> {
  const sb = await getClient();
  const { data, error } = await sb.from('wishes').insert(w).select().single();
  if (error) return { ok: false, rateLimited: /slow down/i.test(error.message) };
  return { ok: true, wish: data as Wish };
}

export function subscribeWishes(cb: (w: Wish) => void): () => void {
  if (!hasBackend) return () => {};
  let off = () => {};
  let dead = false;
  getClient().then((sb) => {
    if (dead) return;
    const ch = sb
      .channel('wishes-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (p) => cb(p.new as Wish))
      .subscribe();
    off = () => void sb.removeChannel(ch);
  });
  return () => {
    dead = true;
    off();
  };
}
