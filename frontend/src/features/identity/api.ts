import { supabase } from '@/lib/supabase';

export type EnsureProfileResult = { ok: true } | { ok: false; reason: 'NICKNAME_TAKEN' };

/** 닉네임 사전 가용성 조회 (UX용). 최종 판정은 ensureProfile의 unique 제약. */
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
 * profiles에 (device_id, nickname) 등록.
 * nickname UNIQUE 위반(23505)이면 NICKNAME_TAKEN 반환.
 * 이미 같은 device_id로 존재하면(재설치 아님) 성공 처리.
 */
export async function ensureProfile(
  deviceId: string,
  nickname: string,
): Promise<EnsureProfileResult> {
  const { error } = await supabase
    .from('profiles')
    .insert({ device_id: deviceId, nickname });

  if (error) {
    // 23505 = unique_violation. nickname 또는 device_id PK 충돌.
    if (error.code === '23505') {
      // device_id PK 충돌(동일 기기 재시도)인지 확인 → 그 경우는 성공으로 간주.
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
