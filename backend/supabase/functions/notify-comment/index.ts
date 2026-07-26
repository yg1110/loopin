// Supabase Edge Function: 댓글 INSERT 시 게시물 작성자에게 푸시 발송
// - 네이티브(Expo push token) + 웹(Web Push / PWA) 둘 다 지원 (../_shared/push.ts)
//
// 배포 (backend/ 에서 실행):
//   supabase login
//   supabase functions deploy notify-comment --project-ref tyervopkkaitmeerwdru
// 웹 푸시용 시크릿:
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// 웹훅 연결: backend/migrations/0002_push.sql 하단 트리거 또는 대시보드 Webhooks.
//
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동 주입.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/push.ts';

type CommentRecord = { id: string; post_id: string; author_id: string; body: string };

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record: CommentRecord | undefined = payload.record ?? payload.new;
    if (!record?.post_id) return new Response('no record', { status: 200 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: post } = await supabase
      .from('posts')
      .select('owner_id')
      .eq('id', record.post_id)
      .maybeSingle();
    if (!post) return new Response('no post', { status: 200 });
    if (post.owner_id === record.author_id) return new Response('self comment', { status: 200 });

    const { data: author } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('device_id', record.author_id)
      .maybeSingle();

    const summary = await sendPush(supabase, [post.owner_id], {
      title: `${author?.nickname ?? '누군가'}님이 댓글을 남겼어요`,
      body: record.body,
      url: `/post/${record.post_id}`,
      data: { postId: record.post_id },
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-comment error', e);
    return new Response('error', { status: 200 });
  }
});
