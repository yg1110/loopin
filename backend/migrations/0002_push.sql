-- Loopin 2차 MVP: 푸시 알림용 토큰 저장
-- 적용: Supabase 대시보드 SQL 에디터 또는 `supabase db push`

create table if not exists public.push_tokens (
  device_id       uuid primary key references public.profiles(device_id) on delete cascade,
  expo_push_token text not null,
  updated_at      timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists anon_all on public.push_tokens;
create policy anon_all on public.push_tokens
  for all to anon, authenticated using (true) with check (true);

grant all on public.push_tokens to anon, authenticated;

-- ============================================================
-- 댓글 INSERT → Edge Function(notify-comment) 호출 웹훅
-- 전제: `notify-comment` 함수가 먼저 배포되어 있어야 함 (backend/에서):
--   supabase login
--   supabase functions deploy notify-comment --project-ref tyervopkkaitmeerwdru
-- 프로젝트 ref는 이미 tyervopkkaitmeerwdru로 채워둠.
-- (pg_net 확장 필요: 대시보드 Database → Extensions에서 pg_net 활성화,
--  또는 대시보드 Database → Webhooks GUI로 생성해도 됨.)
-- ============================================================

-- create extension if not exists pg_net;
--
-- create or replace function public.on_comment_notify()
-- returns trigger language plpgsql security definer as $$
-- begin
--   perform net.http_post(
--     url     := 'https://tyervopkkaitmeerwdru.functions.supabase.co/notify-comment',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body    := jsonb_build_object('record', to_jsonb(new))
--   );
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_comment_created on public.comments;
-- create trigger on_comment_created
--   after insert on public.comments
--   for each row execute function public.on_comment_notify();
