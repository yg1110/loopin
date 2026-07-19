import { supabase } from '@/lib/supabase';

export type EnsureProfileResult = { ok: true } | { ok: false; reason: 'NICKNAME_TAKEN' };

export async function isNicknameTaken(nickname: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('device_id')
    .eq('nickname', nickname)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * 이 기기의 프로필이 DB에 존재하는지 확인.
 * - true: 존재 / false: 명확히 없음(삭제됨) → 자동 로그아웃 대상
 * - 네트워크·서버 오류 시엔 null 반환(오프라인에서 잘못 로그아웃 방지)
 */
export async function profileExists(deviceId: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) return null;
  return !!data;
}

export async function ensureProfile(
  deviceId: string,
  nickname: string,
): Promise<EnsureProfileResult> {
  const { error } = await supabase.from('profiles').insert({ device_id: deviceId, nickname });
  if (error) {
    if (error.code === '23505') {
      const { data } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('device_id', deviceId)
        .maybeSingle();
      if (data?.nickname === nickname) return { ok: true };
      return { ok: false, reason: 'NICKNAME_TAKEN' };
    }
    throw error;
  }
  return { ok: true };
}
