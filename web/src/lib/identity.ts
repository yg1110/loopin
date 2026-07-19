const DEVICE_ID_KEY = 'loopin.device_id';
const NICKNAME_KEY = 'loopin.nickname';

/** 기기 UUID를 조회하거나 최초 1회 생성해 영속 (auth 대체 신원). */
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getStoredNickname(): string | null {
  return localStorage.getItem(NICKNAME_KEY);
}

export function saveNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

/**
 * 로그아웃: 로컬 닉네임(세션)만 제거. device_id는 유지한다.
 * → 같은 닉네임으로 재로그인 시 기존 프로필에 재연결 가능(프로필이 있으면),
 *   프로필이 삭제된 경우엔 재등록이 정상 동작.
 */
export function clearNickname(): void {
  localStorage.removeItem(NICKNAME_KEY);
}
