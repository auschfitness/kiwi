-- English → USA progress sync.
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

-- ---------------------------------------------------------------------------
-- Background push reminders.
--
-- Appended, never edited into what is above: the `progress` table and its two
-- functions are live and hold her real progress. Everything below is
-- `if not exists` / `or replace`, so this whole file stays safe to re-run.
--
-- The security shape is identical to `progress` above, on purpose: RLS on,
-- **no policies at all** for anon, and every route in through a
-- security-definer function that has to be told the endpoint or the code. The
-- anon key by itself reaches nothing, and rows cannot be enumerated.
-- ---------------------------------------------------------------------------

create table if not exists public.push_subscriptions (
  -- Her sync code, so the sender can look up whether she has already studied
  -- today and skip the nudge. Nullable: push works fine for someone who never
  -- set up cloud sync — the sender just cannot make that check for her.
  code text,
  -- The push service's URL for this device. Unique by nature, so it is the
  -- key: re-subscribing the same device updates the row instead of adding one.
  endpoint text primary key,
  -- `{ "p256dh": "...", "auth": "..." }`, straight from PushSubscription.toJSON().
  keys jsonb not null,
  -- `"HH:MM"`, 24-hour, in her own local time.
  reminder_time text not null,
  -- IANA zone from the device, e.g. `America/Chicago`. `reminder_time` means
  -- nothing without it.
  tz text not null,
  -- The last local date we pushed to this device. What stops a 15-minute
  -- schedule from sending fifteen reminders.
  last_sent date,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- The sender scans by time-of-day every quarter hour; keep that cheap even if
-- the table ever grows past one learner's handful of devices.
create index if not exists push_subscriptions_reminder_time_idx
  on public.push_subscriptions (reminder_time);

create or replace function public.upsert_push_subscription(
  p_code text,
  p_endpoint text,
  p_keys jsonb,
  p_reminder_time text,
  p_tz text
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.push_subscriptions(code, endpoint, keys, reminder_time, tz, updated_at)
  values (p_code, p_endpoint, p_keys, p_reminder_time, p_tz, now())
  on conflict (endpoint) do update set
    code = excluded.code,
    keys = excluded.keys,
    reminder_time = excluded.reminder_time,
    tz = excluded.tz,
    updated_at = now();
  -- Note what is NOT reset here: last_sent. Re-subscribing (which the app
  -- does on every open) must not re-arm a reminder already sent today.
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

revoke all on function public.upsert_push_subscription(text, text, jsonb, text, text) from public;
revoke all on function public.delete_push_subscription(text) from public;
grant execute on function public.upsert_push_subscription(text, text, jsonb, text, text) to anon;
grant execute on function public.delete_push_subscription(text) to anon;
