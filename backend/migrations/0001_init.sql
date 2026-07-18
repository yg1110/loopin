-- Loopin 1차 MVP 초기 스키마
-- 적용: Supabase CLI `supabase db push` 또는 대시보드 SQL 에디터에 붙여넣기.
-- 주의: auth 미구현 → RLS는 허용형(anon 전권). device_id 신뢰 모델(위변조 방지 없음).
--       공개 배포 전 익명/정식 auth로 강화 권장.

-- ============================================================
-- 1) 테이블
-- ============================================================

-- profiles: 기기 = 사용자
create table if not exists public.profiles (
  device_id   uuid primary key,
  nickname    text not null unique,
  created_at  timestamptz not null default now()
);

-- habits: 개인 소유 습관
create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(device_id) on delete cascade,
  name        text not null,
  emoji       text,
  color       text,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists habits_owner_idx on public.habits(owner_id) where archived_at is null;

-- completions: 하루 1회 유니크
create table if not exists public.completions (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  owner_id    uuid not null references public.profiles(device_id) on delete cascade,
  day_key     text not null,                 -- 'YYYY-MM-DD' (기기 로컬 tz)
  created_at  timestamptz not null default now(),
  unique (habit_id, day_key)
);
create index if not exists completions_habit_idx on public.completions(habit_id);

-- posts: 공개 피드 게시물 (habit 스냅샷)
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(device_id) on delete cascade,
  habit_name   text not null,                -- 게시 시점 스냅샷
  streak_count int  not null default 0,      -- 게시 시점 스냅샷
  caption      text,
  image_url    text,                         -- nullable (사진 선택)
  day_key      text not null,
  created_at   timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

-- comments
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(device_id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id, created_at);

-- ============================================================
-- 2) 피드 조회 뷰 (닉네임 조인 + 댓글 수)
-- ============================================================
create or replace view public.feed_posts as
select
  p.id, p.owner_id, p.habit_name, p.streak_count, p.caption, p.image_url,
  p.day_key, p.created_at,
  pr.nickname,
  (select count(*) from public.comments c where c.post_id = p.id) as comment_count
from public.posts p
join public.profiles pr on pr.device_id = p.owner_id;

-- ============================================================
-- 3) RLS (허용형 — MVP 전용)
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.habits      enable row level security;
alter table public.completions enable row level security;
alter table public.posts       enable row level security;
alter table public.comments    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','habits','completions','posts','comments'] loop
    execute format('drop policy if exists anon_all on public.%I;', t);
    execute format(
      'create policy anon_all on public.%I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- anon/authenticated 권한 부여 (Supabase 기본 grant 보강)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant select on public.feed_posts to anon, authenticated;

-- ============================================================
-- 4) Storage: post-images 버킷 (공개 읽기 / anon 쓰기)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post-images read"  on storage.objects;
drop policy if exists "post-images write" on storage.objects;

create policy "post-images read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'post-images');

create policy "post-images write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'post-images');
