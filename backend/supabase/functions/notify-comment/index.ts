// Supabase Edge Function: 댓글 INSERT 시 게시물 작성자에게 Expo 푸시 발송
//
// 배포 (backend/ 에서 실행):
//   supabase login
//   supabase functions deploy notify-comment --project-ref tyervopkkaitmeerwdru
//   (verify_jwt=false는 config.toml에 설정됨)
// 웹훅 연결: backend/migrations/0002_push.sql 하단 트리거 또는 대시보드 Database → Webhooks.
//
// 실행 환경변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)는 Supabase가 자동 주입.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CommentRecord = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Supabase DB Webhook: { record }, 또는 트리거에서 { record } 전달
    const record: CommentRecord | undefined = payload.record ?? payload.new;
    if (!record?.post_id) {
      return new Response('no record', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 게시물 작성자 조회
    const { data: post } = await supabase
      .from('posts')
      .select('owner_id, habit_name')
      .eq('id', record.post_id)
      .maybeSingle();
    if (!post) return new Response('no post', { status: 200 });

    // 자기 게시물에 자기가 댓글 → 알림 스킵
    if (post.owner_id === record.author_id) {
      return new Response('self comment', { status: 200 });
    }

    // 작성자 푸시 토큰
    const { data: tokenRow } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('device_id', post.owner_id)
      .maybeSingle();
    if (!tokenRow?.expo_push_token) {
      return new Response('no token', { status: 200 });
    }

    // 댓글 작성자 닉네임
    const { data: author } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('device_id', record.author_id)
      .maybeSingle();

    // Expo Push API 호출
    const message = {
      to: tokenRow.expo_push_token,
      sound: 'default',
      title: `${author?.nickname ?? '누군가'}님이 댓글을 남겼어요`,
      body: record.body,
      data: { postId: record.post_id },
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-comment error', e);
    return new Response('error', { status: 200 }); // 웹훅 재시도 폭주 방지
  }
});
