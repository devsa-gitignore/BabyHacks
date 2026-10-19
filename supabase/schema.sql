-- Run this once in Supabase -> SQL Editor.

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 80),
  color text not null check (color in ('pink','aqua','periwinkle','yellow','orange')),
  icon text not null check (icon in ('star','heart','moon','cloud','sparkle')),
  device_id text not null check (char_length(device_id) between 8 and 64),
  created_at timestamptz not null default now()
);

alter table public.wishes enable row level security;

drop policy if exists "read wishes" on public.wishes;
create policy "read wishes" on public.wishes for select using (true);

drop policy if exists "add wishes" on public.wishes;
create policy "add wishes" on public.wishes for insert with check (true);

create index if not exists wishes_created_at_idx on public.wishes (created_at desc);

-- One wish per device every 10 seconds (soft limit: device_id is client-chosen).
create or replace function public.wishes_rate_limit() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.wishes
    where device_id = new.device_id and created_at > now() - interval '10 seconds'
  ) then
    raise exception 'slow down';
  end if;
  return new;
end $$;

drop trigger if exists wishes_rate_limit on public.wishes;
create trigger wishes_rate_limit before insert on public.wishes
  for each row execute function public.wishes_rate_limit();

-- Live updates (Realtime). Safe to re-run: ignore the error if already added.
do $$
begin
  alter publication supabase_realtime add table public.wishes;
exception when duplicate_object then null;
end $$;
