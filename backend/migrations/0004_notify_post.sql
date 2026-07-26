-- Loopin: 피드 게시물 INSERT → Edge Function(notify-post) 호출 웹훅
-- 적용: Supabase 대시보드 SQL 에디터에 붙여넣기 또는 `supabase db push`
--
-- 전제 조건
--  1) notify-post 함수 배포 (backend/ 에서):
--       supabase functions deploy notify-post --project-ref tyervopkkaitmeerwdru
--  2) 웹 푸시 시크릿 등록 (notify-comment와 공용):
--       supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
--  3) pg_net 확장 활성화 (대시보드 Database → Extensions → pg_net)
--
-- 대시보드 Database → Webhooks GUI로 만들 경우 이 파일은 적용하지 않아도 된다.
-- (테이블 posts / 이벤트 INSERT / URL https://tyervopkkaitmeerwdru.functions.supabase.co/notify-post)

create extension if not exists pg_net;

create or replace function public.on_post_notify()
returns trigger language plpgsql security definer as $$
begin
  perform net.http_post(
    url     := 'https://tyervopkkaitmeerwdru.functions.supabase.co/notify-post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists on_post_created on public.posts;
create trigger on_post_created
  after insert on public.posts
  for each row execute function public.on_post_notify();
