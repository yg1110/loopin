// Supabase Edge Function: 피드 게시물 INSERT 시 다른 사용자 전원에게 푸시 발송
// - 팔로우 개념이 없는 공개 피드이므로 구독 중인 모든 기기(작성자 포함)에 브로드캐스트
// - 네이티브(Expo push token) + 웹(Web Push / PWA) 둘 다 지원
//
// 배포 (backend/ 에서 실행):
//   supabase functions deploy notify-post --project-ref tyervopkkaitmeerwdru
// 웹 푸시용 시크릿(notify-comment와 공용):
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// 웹훅 연결: backend/migrations/0004_notify_post.sql
//
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동 주입.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { allDeviceIds, sendPush } from '../_shared/push.ts';

type PostRecord = {
  id: string;
  owner_id: string;
  kind?: 'habit' | 'diary' | null;
  habit_name: string | null;
  streak_count: number;
  title?: string | null;
  caption: string | null;
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record: PostRecord | undefined = payload.record ?? payload.new;
    if (!record?.id || !record.owner_id) return new Response('no record', { status: 200 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: owner } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('device_id', record.owner_id)
      .maybeSingle();

    const nickname = owner?.nickname ?? '누군가';
    const isDiary = record.kind === 'diary';
    const caption = record.caption?.trim();

    // 습관 인증: "물 2L 마시기 (3일 연속) — 한마디"
    // 일기:      "제목 — 본문 앞부분"
    const headline = isDiary ? (record.title ?? '일기') : record.habit_name ?? '습관';
    const streak = !isDiary && record.streak_count > 0 ? ` (${record.streak_count}일 연속)` : '';
    const title = `${nickname}님이 ${isDiary ? '일기를' : '인증을'} 올렸어요`;
    const body = caption ? `${headline}${streak} — ${caption}` : `${headline}${streak}`;

    // 작성자 본인 기기도 포함해 모든 구독 기기에 발송한다.
    const targets = await allDeviceIds(supabase);
    const summary = await sendPush(supabase, targets, {
      title,
      body,
      url: `/post/${record.id}`,
      data: { postId: record.id },
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-post error', e);
    return new Response('error', { status: 200 });
  }
});
