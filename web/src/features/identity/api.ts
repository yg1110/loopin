import { supabase } from '@/lib/supabase';

/** 닉네임 로그인 결과. deviceId는 앞으로 이 기기가 사용할 신원. */
export type SignInResult = { deviceId: string; created: boolean };

/** 닉네임으로 프로필을 찾아 device_id 반환 (없으면 null). */
async function findDeviceIdByNickname(nickname: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('device_id')
    .eq('nickname', nickname)
    .maybeSingle();
  if (error) throw error;
  return data?.device_id ?? null;
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

/**
 * 닉네임만으로 로그인.
 * - 이미 존재하는 닉네임이면 그 프로필의 device_id를 이어받아 "해당 닉네임으로 로그인".
 * - 없는 닉네임이면 새 프로필을 만든다.
 *
 * 주의: 비밀번호가 없는 신원 모델이라 닉네임을 아는 누구나 그 계정에 접근할 수 있다.
 *       (MVP 전제 — 정식 auth 도입 시 재검토)
 */
export async function signInWithNickname(
  currentDeviceId: string,
  nickname: string,
): Promise<SignInResult> {
  const existing = await findDeviceIdByNickname(nickname);
  if (existing) return { deviceId: existing, created: false };

  // 이 기기의 device_id가 이미 다른 닉네임에 묶여 있으면(PK 충돌) 새 신원을 발급한다.
  const inUse = await profileExists(currentDeviceId);
  let deviceId = inUse === true ? crypto.randomUUID() : currentDeviceId;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from('profiles').insert({ device_id: deviceId, nickname });
    if (!error) return { deviceId, created: true };
    if (error.code !== '23505') throw error;

    // 유니크 충돌: 그 사이 누가 같은 닉네임을 선점했으면 그 프로필로 로그인.
    const raced = await findDeviceIdByNickname(nickname);
    if (raced) return { deviceId: raced, created: false };
    // 닉네임은 여전히 비어 있음 → device_id 쪽 충돌이므로 새 UUID로 재시도.
    deviceId = crypto.randomUUID();
  }
  throw new Error('프로필 생성에 실패했습니다.');
}
