// Supabase Edge Function: 데이트 코스 INSERT 시 모든 기기에 푸시 발송
// - 구독 중인 모든 기기(등록자 포함)에 브로드캐스트
// - 네이티브(Expo push token) + 웹(Web Push / PWA) 둘 다 지원
//
// 배포 (backend/ 에서 실행):
//   supabase functions deploy notify-course --project-ref tyervopkkaitmeerwdru
// 웹훅 연결: backend/migrations/0007_push_triggers.sql
//
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동 주입.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { allDeviceIds, sendPush } from '../_shared/push.ts';

type CourseRecord = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  place: string | null;
  memo: string | null;
};

/** web/src/lib/courseCategory.ts 와 같은 코드 체계 */
const CATEGORY_LABEL: Record<string, string> = {
  food: '🍽️ 맛집',
  cafe: '☕ 카페',
  culture: '🎨 전시·문화',
  activity: '🎯 액티비티',
  nature: '🌿 자연·산책',
  etc: '📍 기타',
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record: CourseRecord | undefined = payload.record ?? payload.new;
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
    const category = CATEGORY_LABEL[record.category ?? 'etc'] ?? CATEGORY_LABEL.etc;
    const detail = record.place?.trim() || record.memo?.trim();

    const title = `${nickname}님이 데이트 코스를 추가했어요`;
    const body = detail ? `${category} · ${record.name} — ${detail}` : `${category} · ${record.name}`;

    const targets = await allDeviceIds(supabase);
    const summary = await sendPush(supabase, targets, {
      title,
      body,
      url: '/course',
      data: { courseId: record.id },
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-course error', e);
    return new Response('error', { status: 200 });
  }
});
