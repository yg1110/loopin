# Loopin — Backend (Supabase)

공유형 소셜 습관 추적기의 백엔드다. **모든 데이터(습관·완료·게시물·댓글·프로필)가 여기 저장**된다 — 서버가 source of truth이며, 로컬 오프라인 저장은 사용하지 않는다.

## Supabase = 관리형 Postgres
"Postgres를 따로 설치·배포하지 않는다." **Supabase가 곧 관리형 Postgres**다. Supabase 프로젝트 하나를 만들면 아래가 모두 포함된다:
- **Database** — Postgres (여기에 스키마·RLS 적용)
- **Storage** — 사진 버킷(`post-images`)
- **Edge Functions / Database Webhooks** — 2차 푸시 발송용

즉 우리가 다루는 건 "Supabase 프로젝트 1개"뿐이고, 그 안의 DB가 Postgres다.

## 인증(auth) 없음
이메일/로그인 auth를 구현하지 않는다. 앱이 기기에서 만든 `device_id`(UUID)로 사용자를 식별하고, 닉네임은 서버에서 unique로 관리한다. RLS는 초기용 **허용형(permissive)** — device_id 신뢰 모델이며 위변조 방지가 없다. ⚠️ 공개 배포 전 익명 auth 등으로 강화 권장.

## 구조
```
backend/
├─ migrations/            # SQL 스키마·RLS·뷰 (profiles, habits, completions, posts, comments)
├─ supabase/functions/
│  ├─ _shared/push.ts     # 푸시 발송 공통 모듈 (Expo + Web Push)
│  ├─ notify-comment/     # 댓글 INSERT → 게시물 작성자에게 푸시
│  └─ notify-post/        # 게시물 INSERT → 작성자 제외 전원에게 푸시(브로드캐스트)
└─ README.md
```

### 푸시 알림
| 트리거 | 함수 | 수신자 | 웹훅 SQL |
| --- | --- | --- | --- |
| `comments` INSERT | `notify-comment` | 게시물 작성자 (본인 댓글 제외) | `migrations/0002_push.sql` |
| `posts` INSERT | `notify-post` | 작성자를 제외한 모든 구독자 | `migrations/0004_notify_post.sql` |

배포·시크릿:
```bash
supabase functions deploy notify-comment notify-post --project-ref tyervopkkaitmeerwdru
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

## 데이터 모델
- `profiles`: device_id(PK), nickname(UNIQUE), created_at
- `habits`: id, owner_id(FK profiles), name, emoji, color, created_at, archived_at
- `completions`: id, habit_id(FK), owner_id, day_key('YYYY-MM-DD'), created_at, **UNIQUE(habit_id, day_key)**
- `posts`: id, owner_id, habit_name(스냅샷), streak_count, caption, image_url(nullable), day_key, created_at
- `comments`: id, post_id(FK), author_id, body, created_at
- 뷰 `feed_posts`: posts + profiles(nickname) + 댓글수 집계
- (2차) `push_tokens`: device_id, expo_push_token, updated_at
- (2차) `web_push_subscriptions`: device_id, subscription(jsonb), updated_at

## RLS / Storage
- 모든 테이블 RLS 허용형(anon 전권, MVP) — 배포 전 강화
- Storage `post-images` 버킷: public read, anon write, 경로 `{device_id}/{uuid}.jpg`

## 제외 (현 범위 아님)
- 이메일 auth, Realtime, 반응(post_reactions), 통계/집계, profiles 자동생성 트리거

> 상세 스키마 DDL·RLS·다이어그램은 [`docs/DESIGN.md`](../docs/DESIGN.md), 계획은 [`docs/PLAN.md`](../docs/PLAN.md) 참고. 아직 구현 전 상태.
