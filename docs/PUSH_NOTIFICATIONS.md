# Loopin 푸시 알림 (Supabase + PWA Web Push)

웹(PWA)과 네이티브(Expo) 양쪽에 푸시를 보내는 전체 구조와, **"댓글 알림은 오는데 피드 게시물 알림은 안 오는" 문제의 원인·점검 절차**를 정리한다.

관련 코드
- 백엔드: `backend/supabase/functions/` (`_shared/push.ts`, `notify-comment`, `notify-post`, `notify-course`)
- 트리거: `backend/migrations/0007_push_triggers.sql` (0002 하단·0004는 이걸로 대체됨)
- 웹 클라이언트: `web/src/lib/webpush.ts`, `web/src/sw.ts`, `web/vite.config.ts`

---

## 1. 전체 흐름

```
[사용자 액션]            [Postgres]                [Edge Function]            [전송]              [기기]
댓글 작성      ─insert→  comments   ─trigger─→  notify-comment  ─┐
게시물/일기 작성 ─insert→  posts      ─trigger─→  notify-post     ─┼→ _shared/push.ts ─┬→ Expo Push  → 네이티브 앱
데이트코스 추가  ─insert→ date_courses ─trigger─→ notify-course   ─┘                   └→ Web Push   → sw.ts → 알림 표시
```

1. 앱이 테이블에 INSERT (`web/src/features/*/api.ts`)
2. `after insert` 트리거가 `public.notify_edge_function(fn, row)` 호출
   → `pg_net.http_post`로 `https://<ref>.functions.supabase.co/<fn>` 에 `{ "record": <행 JSON> }` POST
3. Edge Function이 service-role 키로 대상 device_id를 계산하고 문구를 조립
4. `_shared/push.ts::sendPush()` 가 두 채널로 발송
   - `push_tokens` → Expo Push API (100개씩 배치)
   - `web_push_subscriptions` → `npm:web-push` (VAPID 서명)
   - 404/410 응답이면 만료 구독으로 보고 해당 행 삭제
5. 브라우저 서비스워커(`web/src/sw.ts`)의 `push` 이벤트 → `showNotification()`,
   `notificationclick` → payload의 `url`로 이동(열린 탭 재사용)

### 수신자 규칙

| 트리거 | 함수 | 수신자 | 클릭 이동 |
| --- | --- | --- | --- |
| `comments` INSERT | `notify-comment` | **게시물 작성자 1명** (본인 댓글이면 발송 안 함) | `/post/<post_id>` |
| `posts` INSERT | `notify-post` | 구독 중인 **모든 기기** (작성자 본인 포함) | `/post/<id>` |
| `date_courses` INSERT | `notify-course` | 구독 중인 **모든 기기** (등록자 포함) | `/course` |

`allDeviceIds()` = `push_tokens` ∪ `web_push_subscriptions` (중복 제거).
과거 버전의 `notify-post`는 `allDeviceIdsExcept(작성자)`를 썼다 — 아래 3장 참고.

### 저장 테이블

| 테이블 | 용도 | 마이그레이션 |
| --- | --- | --- |
| `push_tokens` (device_id PK, expo_push_token) | 네이티브 Expo 토큰 | `0002_push.sql` |
| `web_push_subscriptions` (device_id PK, subscription jsonb) | PWA `PushSubscription.toJSON()` | `0003_web_push.sql` |

둘 다 RLS 허용형(anon 전권) — 로그인 없는 device_id 신뢰 모델이라 그렇다.

---

## 2. 설정 절차 (처음부터)

### 2-1. VAPID 키 생성

```bash
npx web-push generate-vapid-keys
```

- 공개키 → `web/.env` 의 `VITE_VAPID_PUBLIC_KEY` (빌드 시 번들에 포함)
- 공개키·비밀키 → Edge Function 시크릿

```bash
cd backend
supabase secrets set \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:you@example.com
```

> `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 자동 주입하므로 직접 설정하지 않는다.
> 공개키를 바꾸면 **기존 구독은 전부 무효**가 되어 재구독이 필요하다.

### 2-2. 함수 배포

```bash
cd backend
supabase login
supabase functions deploy notify-comment notify-post notify-course \
  --project-ref tyervopkkaitmeerwdru
```

### 2-3. 트리거 연결

대시보드 SQL 에디터에 `backend/migrations/0007_push_triggers.sql` 전체를 붙여넣고 실행한다(여러 번 실행해도 안전). `pg_net` 확장도 이 파일에서 함께 활성화된다.

> 대시보드 **Database → Webhooks** GUI로 만든 훅이 이미 있다면 SQL 트리거와 **중복 발송**이 되므로, 둘 중 하나만 쓴다.

### 2-4. 웹 클라이언트

- `vite-plugin-pwa` (`injectManifest`, `srcDir: src`, `filename: sw.ts`)가 `src/sw.ts`를 서비스워커로 빌드
- 앱 로드 시 `App.tsx` → `syncWebPush(deviceId)`: 이미 권한이 `granted`면 조용히 구독을 확인·재저장
- 프로필 화면의 버튼 → `enableWebPush(deviceId)`: **사용자 제스처 안에서** 권한 요청 → `pushManager.subscribe()` → `web_push_subscriptions` upsert

iOS 주의: Safari는 **홈 화면에 추가된 PWA에서만** Web Push가 동작한다(iOS 16.4+). 브라우저 탭 상태에서는 구독 자체가 되지 않는다.

---

## 3. 문제: 댓글 알림은 오는데 피드 게시물 알림이 안 온다

댓글이 정상이라는 것은 **클라이언트 구독·서비스워커·VAPID 키·`sendPush()` 발송 경로가 모두 정상**이라는 뜻이다. 즉 공통 구간은 무죄이고, 원인은 `posts` 전용 구간(트리거 등록 / 함수 배포 / 수신자 계산) 중 하나다. 가능성 순으로:

### 원인 ① `posts` 트리거가 DB에 등록되어 있지 않다 (가장 유력)

`0002_push.sql`의 댓글 트리거 SQL은 **전부 주석 처리**되어 있다. 그런데도 댓글 알림이 동작한다는 것은, 댓글 훅만 대시보드 **Database → Webhooks GUI**로 손수 만들어 뒀다는 뜻이다. `notify-post` 트리거는 `0004`/`0007` SQL로만 존재하므로, 그 파일을 실행한 적이 없으면 `posts`에 INSERT가 나도 **아무 HTTP 호출도 일어나지 않는다.**

확인:

```sql
select tgname, tgrelid::regclass as table_name
from pg_trigger
where not tgisinternal
  and tgrelid in ('public.comments'::regclass,
                  'public.posts'::regclass,
                  'public.date_courses'::regclass);
```

`on_post_created`가 없으면 확정. → `0007_push_triggers.sql` 실행.
(GUI 훅 쪽도 대시보드 Database → Webhooks 목록에서 `posts` 행이 있는지 같이 본다.)

### 원인 ② `notify-post` 함수가 배포되지 않았다

댓글 함수만 배포한 상태일 수 있다. 대시보드 Edge Functions 목록에 `notify-post`, `notify-course`가 보이는지 확인하고, 없으면 2-2의 배포 명령을 실행한다.

### 원인 ③ 배포된 `notify-post`가 구버전이라 "작성자 제외"로 동작한다

커밋 `b06b50e`에서 `allDeviceIdsExcept(작성자)` → `allDeviceIds()`로 바꿨지만, **이 커밋 이후 재배포하지 않았다면** 배포본은 여전히 작성자를 제외한다. 기기가 사실상 본인 것뿐이거나 상대 기기가 아직 구독 전이면, 대상이 0명이 되어 "게시글을 올려도 나에게 알림이 안 오는" 증상과 정확히 일치한다.
반면 댓글은 상대 게시물에 다는 경우가 많아 정상으로 보인다.

→ 재배포로 해결. 배포 여부는 함수 로그의 응답 JSON `targets` 값으로 판별된다(`targets: 0`이면 이 케이스 의심).

### 원인 ④ `pg_net` 미활성 / 트리거 호출 실패

`pg_net`이 꺼져 있으면 `net.http_post` 호출에서 예외가 난다. `0007`의 `create extension if not exists pg_net;`이 이를 처리한다.

```sql
select * from pg_extension where extname = 'pg_net';
-- 최근 호출 결과 (pg_net 큐)
select id, url, status_code, error_msg, created
from net._http_response order by created desc limit 20;
```

### 원인 ⑤ 함수는 호출됐지만 내부에서 조용히 끝났다

`notify-post`는 어떤 실패든 **항상 200**을 돌려준다(웹훅 재시도 폭주 방지). 그래서 실패가 밖에서 안 보인다. 로그로만 판별 가능:

```bash
supabase functions logs notify-post --project-ref tyervopkkaitmeerwdru
```

- `"no record"` → 페이로드에 `record`/`new`가 없음 (GUI 훅 설정이 `posts`가 아니거나 payload 형식 문제)
- `targets: 0` → 구독 기기 없음 또는 원인 ③
- `webSent: 0` + `errors` 비어 있음 → `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` 시크릿 미설정 (키가 없으면 웹 발송을 통째로 건너뛴다)
- `webExpired > 0` → 만료 구독을 지운 것. 해당 기기에서 재구독 필요

### 원인 ⑥ 게시물이 실제로 INSERT가 아니다

일기 **수정**(`updatePost`)은 UPDATE라 `after insert` 트리거가 걸리지 않는다. 수정 시에도 알림을 원하면 트리거를 `after insert or update`로 넓혀야 한다(현재는 의도적으로 INSERT만).

### 점검 순서 (요약)

1. `pg_trigger` 조회 → `on_post_created` 존재? 없으면 `0007` 실행 ← **여기서 대부분 끝난다**
2. Edge Functions 목록에 `notify-post` 존재? 없으면 배포
3. `b06b50e` 이후 재배포한 적 있나? 없으면 재배포 (원인 ③)
4. `supabase functions logs notify-post` 로 `targets`/`webSent`/`errors` 확인
5. `net._http_response` 로 트리거가 실제로 HTTP 호출을 했는지 확인

### 수동 발송 테스트 (DB·트리거 우회)

함수 자체만 검증하려면 직접 호출한다.

```bash
curl -X POST https://tyervopkkaitmeerwdru.functions.supabase.co/notify-post \
  -H 'Content-Type: application/json' \
  -d '{"record":{"id":"00000000-0000-0000-0000-000000000000","owner_id":"<본인 device_id>","kind":"diary","title":"테스트","caption":"푸시 확인","streak_count":0,"habit_name":null}}'
```

응답 JSON의 `targets` / `webSent` / `errors`로 어느 구간이 막혔는지 바로 나온다.
이게 성공하는데 실제 글 작성 시 안 오면 → **트리거 문제(원인 ①·④)** 로 확정된다.

---

## 4. 알아둘 제약

- 알림 문구·클릭 경로는 Edge Function이 조립한다. 문구를 바꾸면 **재배포**가 필요하다(마이그레이션과 무관).
- `notify-post`/`notify-course`는 작성자 본인에게도 보낸다 — 동작 확인을 쉽게 하려는 의도적 선택이다.
- 웹 푸시 payload는 `{ title, body, url }` 뿐이다. `data`(postId 등)는 Expo 쪽만 받는다.
- 서비스워커 갱신은 `registerType: 'autoUpdate'`라 배포 후 다음 로드에 반영되지만, 이미 열린 탭은 갱신 전 SW를 쓸 수 있다.
- 함수는 실패해도 200을 반환하므로, 문제 추적은 항상 **함수 로그**로 한다.
