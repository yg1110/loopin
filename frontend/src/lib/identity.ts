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
