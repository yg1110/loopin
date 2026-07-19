-- Loopin 웹 푸시(PWA) 구독 저장
-- 적용: Supabase 대시보드 SQL 에디터

create table if not exists public.web_push_subscriptions (
  device_id    uuid primary key references public.profiles(device_id) on delete cascade,
  subscription jsonb not null,        -- PushSubscription.toJSON() (endpoint + keys)
  updated_at   timestamptz not null default now()
);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists anon_all on public.web_push_subscriptions;
create policy anon_all on public.web_push_subscriptions
  for all to anon, authenticated using (true) with check (true);

grant all on public.web_push_subscriptions to anon, authenticated;

-- 웹 푸시는 backend/supabase/functions/notify-comment 가 web_push_subscriptions를 읽어
-- npm:web-push로 발송한다. Edge Function 시크릿 필요:
--   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
