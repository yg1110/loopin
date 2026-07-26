// 푸시 발송 공통 모듈 (네이티브 Expo + 웹 Web Push)
// notify-comment / notify-post 가 공유한다.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

export type PushMessage = {
  title: string;
  body: string;
  /** 알림 클릭 시 이동할 앱 내 경로 (예: /post/<id>) */
  url: string;
  /** 네이티브 앱에 전달할 추가 데이터 */
  data?: Record<string, unknown>;
};

export type PushSummary = {
  targets: number;
  expoSent: number;
  webSent: number;
  webExpired: number;
  errors: string[];
};

const EXPO_BATCH = 100;

/**
 * 대상 device_id 들에게 푸시를 보낸다.
 * - push_tokens(Expo) / web_push_subscriptions(Web Push) 양쪽 모두 조회해 발송
 * - 만료된 웹 구독(404/410)은 정리
 * - 토큰이 없는 기기는 조용히 건너뜀
 */
export async function sendPush(
  supabase: SupabaseClient,
  deviceIds: string[],
  msg: PushMessage,
): Promise<PushSummary> {
  const summary: PushSummary = {
    targets: deviceIds.length,
    expoSent: 0,
    webSent: 0,
    webExpired: 0,
    errors: [],
  };
  if (deviceIds.length === 0) return summary;

  // ── 1) 네이티브 (Expo Push) ────────────────────────────────
  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('device_id, expo_push_token')
    .in('device_id', deviceIds);

  const tokens = (tokenRows ?? [])
    .map((r: { expo_push_token: string | null }) => r.expo_push_token)
    .filter((t: string | null): t is string => !!t);

  for (let i = 0; i < tokens.length; i += EXPO_BATCH) {
    const batch = tokens.slice(i, i + EXPO_BATCH);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            sound: 'default',
            title: msg.title,
            body: msg.body,
            data: { url: msg.url, ...msg.data },
          })),
        ),
      });
      if (res.ok) summary.expoSent += batch.length;
      else summary.errors.push(`expo ${res.status}: ${await res.text()}`);
    } catch (e) {
      summary.errors.push(`expo: ${String(e)}`);
    }
  }

  // ── 2) 웹 (Web Push / PWA) ────────────────────────────────
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@loopin.app';
  if (!vapidPublic || !vapidPrivate) return summary;

  const { data: subRows } = await supabase
    .from('web_push_subscriptions')
    .select('device_id, subscription')
    .in('device_id', deviceIds);
  if (!subRows?.length) return summary;

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: msg.url });

  await Promise.all(
    subRows.map(async (row: { device_id: string; subscription: unknown }) => {
      try {
        // deno-lint-ignore no-explicit-any
        await webpush.sendNotification(row.subscription as any, payload);
        summary.webSent++;
      } catch (e) {
        // deno-lint-ignore no-explicit-any
        const statusCode = (e as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('web_push_subscriptions').delete().eq('device_id', row.device_id);
          summary.webExpired++;
        } else {
          summary.errors.push(`web ${row.device_id}: ${String(e)}`);
        }
      }
    }),
  );

  return summary;
}

/** 구독 중인 전체 기기 목록 (작성자 포함). */
export async function allDeviceIds(supabase: SupabaseClient): Promise<string[]> {
  const [expo, web] = await Promise.all([
    supabase.from('push_tokens').select('device_id'),
    supabase.from('web_push_subscriptions').select('device_id'),
  ]);
  const ids = new Set<string>();
  for (const row of expo.data ?? []) ids.add((row as { device_id: string }).device_id);
  for (const row of web.data ?? []) ids.add((row as { device_id: string }).device_id);
  return [...ids];
}

/** 게시물/댓글 작성자를 제외한 전체 구독자 device_id 목록. */
export async function allDeviceIdsExcept(
  supabase: SupabaseClient,
  excludeDeviceId: string,
): Promise<string[]> {
  const [expo, web] = await Promise.all([
    supabase.from('push_tokens').select('device_id'),
    supabase.from('web_push_subscriptions').select('device_id'),
  ]);
  const ids = new Set<string>();
  for (const row of expo.data ?? []) ids.add((row as { device_id: string }).device_id);
  for (const row of web.data ?? []) ids.add((row as { device_id: string }).device_id);
  ids.delete(excludeDeviceId);
  return [...ids];
}
