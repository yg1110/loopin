-- Loopin: 데이트 코스 (피드와 분리된 별도 탭)
-- 적용: Supabase 대시보드 SQL 에디터 또는 `supabase db push`
--
-- 피드(posts)와 무관한 독립 테이블이다 → 게시물/댓글/푸시 알림과 엮이지 않는다.
-- 목록은 전원 공개(누가 추가했는지 닉네임 표시), 수정·삭제는 앱에서 작성자만 노출.

create table if not exists public.date_courses (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(device_id) on delete cascade,
  name       text not null,                       -- 코스 이름 (필수)
  category   text not null default 'etc',         -- food/cafe/culture/activity/nature/etc
  place      text,                                -- 장소·주소 (지도 검색용)
  link       text,                                -- 참고 링크 (블로그/예약 등)
  memo       text,                                -- 메모
  visited    boolean not null default false,      -- 가봤는지
  created_at timestamptz not null default now()
);

create index if not exists date_courses_created_idx on public.date_courses(created_at desc);
create index if not exists date_courses_owner_idx on public.date_courses(owner_id);

-- ============================================================
-- 목록 뷰 (닉네임 조인)
-- ============================================================
create or replace view public.date_course_list with (security_invoker = on) as
select
  c.id, c.owner_id, c.name, c.category, c.place, c.link, c.memo, c.visited, c.created_at,
  pr.nickname
from public.date_courses c
join public.profiles pr on pr.device_id = c.owner_id;

-- ============================================================
-- RLS (허용형 — MVP 전용, 다른 테이블과 동일 정책)
-- ============================================================
alter table public.date_courses enable row level security;

drop policy if exists anon_all on public.date_courses;
create policy anon_all on public.date_courses
  for all to anon, authenticated using (true) with check (true);

grant all on public.date_courses to anon, authenticated;
grant select on public.date_course_list to anon, authenticated;
