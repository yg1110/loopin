-- Loopin: 공유 일기(diary) 게시물 지원
-- 적용: Supabase 대시보드 SQL 에디터 또는 `supabase db push`
--
-- posts 테이블 하나로 습관 인증(kind='habit')과 일기(kind='diary')를 함께 담는다.
-- 피드는 두 종류를 시간순으로 같이 보여준다.

alter table public.posts
  add column if not exists kind       text not null default 'habit',
  add column if not exists title      text,          -- 일기 제목
  add column if not exists weather    text,          -- 일기 날씨 코드 (sunny/cloudy/rainy/snowy/windy/hot/cold)
  add column if not exists entry_date text;          -- 일기 날짜 'YYYY-MM-DD'

-- 일기는 습관명이 없다
alter table public.posts alter column habit_name drop not null;

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('habit', 'diary'));

-- 습관 인증은 habit_name 필수, 일기는 제목 필수
alter table public.posts drop constraint if exists posts_kind_fields_check;
alter table public.posts add constraint posts_kind_fields_check check (
  (kind = 'habit' and habit_name is not null) or
  (kind = 'diary' and title is not null)
);

create index if not exists posts_kind_created_idx on public.posts(kind, created_at desc);

-- ============================================================
-- 피드 뷰 재정의 (일기 컬럼 포함)
-- ============================================================
drop view if exists public.feed_posts;

create view public.feed_posts with (security_invoker = on) as
select
  p.id, p.owner_id, p.kind, p.habit_name, p.streak_count,
  p.title, p.weather, p.entry_date,
  p.caption, p.image_url, p.day_key, p.created_at,
  pr.nickname,
  (select count(*) from public.comments c where c.post_id = p.id) as comment_count
from public.posts p
join public.profiles pr on pr.device_id = p.owner_id;

grant select on public.feed_posts to anon, authenticated;
