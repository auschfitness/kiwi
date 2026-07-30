-- English → NZ progress sync.
-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.progress (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS on, with NO policies for anon: the table itself is unreachable.
-- All access goes through the two security-definer functions below, which
-- require knowing the code. Row enumeration is therefore impossible.
alter table public.progress enable row level security;

create or replace function public.load_progress(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.progress where code = p_code;
$$;

create or replace function public.save_progress(p_code text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.progress(code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on function public.load_progress(text) from public;
revoke all on function public.save_progress(text, jsonb) from public;
grant execute on function public.load_progress(text) to anon;
grant execute on function public.save_progress(text, jsonb) to anon;
