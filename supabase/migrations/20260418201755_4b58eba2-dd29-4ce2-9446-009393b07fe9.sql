-- Audio guestbook storage bucket
insert into storage.buckets (id, name, public) values ('event-audio', 'event-audio', true)
on conflict (id) do nothing;

-- Audio guestbook table
create table if not exists public.audio_guestbook (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid references public.event_guests(id) on delete set null,
  guest_name text,
  storage_path text not null,
  duration_seconds int default 0,
  created_at timestamptz not null default now()
);

alter table public.audio_guestbook enable row level security;

create policy "Anyone can read audio for an event"
  on public.audio_guestbook for select using (true);

create policy "Anyone can leave audio messages"
  on public.audio_guestbook for insert with check (true);

create policy "Hosts can delete audio for their events"
  on public.audio_guestbook for delete using (
    exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );

-- Storage policies for audio
create policy "Public read of audio guestbook"
  on storage.objects for select
  using (bucket_id = 'event-audio');

create policy "Anyone can upload audio guestbook"
  on storage.objects for insert
  with check (bucket_id = 'event-audio');

-- Platform settings (admin-controlled toggles & API keys for AdSense, etc.)
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

create policy "Anyone can read platform settings"
  on public.platform_settings for select using (true);

-- Seed defaults
insert into public.platform_settings (key, value) values
  ('adsense', '{"enabled": false, "client_id": "", "slot_id": ""}'),
  ('marketing', '{"default_tone": "fun"}')
on conflict (key) do nothing;