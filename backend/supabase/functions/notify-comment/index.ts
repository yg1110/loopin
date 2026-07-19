// Supabase Edge Function: 댓글 INSERT 시 게시물 작성자에게 푸시 발송
// - 네이티브(Expo push token) + 웹(Web Push / PWA) 둘 다 지원
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
import webpush from 'npm:web-push@3';

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

    const title = `${author?.nickname ?? '누군가'}님이 댓글을 남겼어요`;
    const body = record.body;
    const url = `/post/${record.post_id}`;

    const results: Record<string, unknown> = {};

    // 1) 네이티브 (Expo Push)
    const { data: tokenRow } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('device_id', post.owner_id)
      .maybeSingle();
    if (tokenRow?.expo_push_token) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            to: tokenRow.expo_push_token,
            sound: 'default',
            title,
            body,
            data: { postId: record.post_id },
          }),
        });
        results.expo = await res.json();
      } catch (e) {
        results.expo = String(e);
      }
    }

    // 2) 웹 (Web Push / PWA)
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@loopin.app';
    const { data: webSub } = await supabase
      .from('web_push_subscriptions')
      .select('subscription')
      .eq('device_id', post.owner_id)
      .maybeSingle();

    if (webSub?.subscription && vapidPublic && vapidPrivate) {
      try {
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        await webpush.sendNotification(
          // deno-lint-ignore no-explicit-any
          webSub.subscription as any,
          JSON.stringify({ title, body, url }),
        );
        results.web = 'sent';
      } catch (e) {
        // 만료된 구독(404/410)이면 정리
        // deno-lint-ignore no-explicit-any
        const statusCode = (e as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('web_push_subscriptions').delete().eq('device_id', post.owner_id);
          results.web = 'expired-removed';
        } else {
          results.web = String(e);
        }
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-comment error', e);
    return new Response('error', { status: 200 });
  }
});
