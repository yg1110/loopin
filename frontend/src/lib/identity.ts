import 'react-native-get-random-values'; // uuid 앞에 반드시 먼저 로드 (crypto 폴리필)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'loopin.device_id';
const NICKNAME_KEY = 'loopin.nickname';

/** 기기 UUID를 조회하거나 최초 1회 생성해 영속. auth 대체 신원. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = uuidv4();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function getStoredNickname(): Promise<string | null> {
  return AsyncStorage.getItem(NICKNAME_KEY);
}

export async function saveNickname(nickname: string): Promise<void> {
  await AsyncStorage.setItem(NICKNAME_KEY, nickname);
}

/**
 * 로그아웃: 로컬 닉네임(세션)만 제거. device_id는 유지한다.
 * → 같은 닉네임으로 재로그인 시 기존 프로필에 재연결(프로필이 있으면),
 *   프로필이 삭제된 경우엔 재등록이 정상 동작.
 */
export async function clearNickname(): Promise<void> {
  await AsyncStorage.removeItem(NICKNAME_KEY);
}
