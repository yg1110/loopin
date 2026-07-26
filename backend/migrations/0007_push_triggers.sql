-- Loopin: 푸시 알림 웹훅 트리거 일괄 세팅 (댓글 + 게시물/일기 + 데이트 코스)
--
-- ⚠️ 이 파일 하나만 붙여넣으면 세 알림이 모두 연결된다. 여러 번 실행해도 안전(idempotent).
--
-- 전제 조건
--  1) 함수 배포 (backend/ 에서):
--       supabase functions deploy notify-comment notify-post notify-course \
--         --project-ref tyervopkkaitmeerwdru
--  2) 웹 푸시 시크릿:
--       supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
--         VAPID_SUBJECT=mailto:you@example.com
--
-- 적용 후 확인:
--   select tgname, tgrelid::regclass as table_name
--   from pg_trigger
--   where not tgisinternal
--     and tgrelid in ('public.comments'::regclass,
--                     'public.posts'::regclass,
--                     'public.date_courses'::regclass);
--   → on_comment_created / on_post_created / on_course_created 세 줄이 나와야 한다.
--
-- 대시보드 Database → Webhooks GUI 로 이미 만들어 둔 훅이 있으면 중복 발송될 수 있으니
-- GUI 훅을 지우고 이 트리거만 쓰거나, 반대로 이 파일을 적용하지 않는다.

create extension if not exists pg_net;

-- ============================================================
-- 공통 발송 함수: 지정한 Edge Function 으로 record 를 그대로 POST
-- ============================================================
create or replace function public.notify_edge_function(fn text, row_json jsonb)
returns void language plpgsql security definer as $$
begin
  perform net.http_post(
    url     := 'https://tyervopkkaitmeerwdru.functions.supabase.co/' || fn,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object('record', row_json)
  );
end;
$$;

-- ============================================================
-- 1) 댓글 → notify-comment (게시물 작성자에게)
-- ============================================================
create or replace function public.on_comment_notify()
returns trigger language plpgsql security definer as $$
begin
  perform public.notify_edge_function('notify-comment', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.on_comment_notify();

-- ============================================================
-- 2) 게시물(습관 인증 + 일기) → notify-post (모든 기기)
-- ============================================================
create or replace function public.on_post_notify()
returns trigger language plpgsql security definer as $$
begin
  perform public.notify_edge_function('notify-post', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists on_post_created on public.posts;
create trigger on_post_created
  after insert on public.posts
  for each row execute function public.on_post_notify();

-- ============================================================
-- 3) 데이트 코스 → notify-course (모든 기기)
-- ============================================================
create or replace function public.on_course_notify()
returns trigger language plpgsql security definer as $$
begin
  perform public.notify_edge_function('notify-course', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists on_course_created on public.date_courses;
create trigger on_course_created
  after insert on public.date_courses
  for each row execute function public.on_course_notify();
