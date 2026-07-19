import { supabase } from './supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function saveSubscription(deviceId: string, sub: PushSubscription): Promise<void> {
  await supabase.from('web_push_subscriptions').upsert({
    device_id: deviceId,
    subscription: sub.toJSON(),
    updated_at: new Date().toISOString(),
  });
}

/** 사용자 제스처에서 호출: 권한 요청 + 구독 + 저장. 성공 시 true. */
export async function enableWebPush(deviceId: string): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    }));
  await saveSubscription(deviceId, sub);
  return true;
}

/** 앱 로드 시: 이미 허용돼 있으면 구독을 확인·저장(조용히). */
export async function syncWebPush(deviceId: string): Promise<void> {
  if (!isPushSupported() || !VAPID_PUBLIC) return;
  if (Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      }));
    await saveSubscription(deviceId, sub);
  } catch (e) {
    console.warn('[Loopin] web push sync 실패:', e);
  }
}
