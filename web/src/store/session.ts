import { create } from 'zustand';
import {
  clearNickname,
  getOrCreateDeviceId,
  getStoredNickname,
  saveDeviceId,
  saveNickname,
} from '@/lib/identity';

type SessionState = {
  deviceId: string;
  nickname: string | null;
  /** 닉네임 로그인: 서버가 확정한 device_id로 신원을 갈아끼운다. */
  signIn: (deviceId: string, nickname: string) => void;
  logout: () => void;
};

// localStorage는 동기라 초기값을 바로 채운다 (RN의 async bootstrap 불필요)
export const useSession = create<SessionState>((set) => ({
  deviceId: getOrCreateDeviceId(),
  nickname: getStoredNickname(),
  signIn: (deviceId, nickname) => {
    saveDeviceId(deviceId);
    saveNickname(nickname);
    set({ deviceId, nickname });
  },
  logout: () => {
    clearNickname();
    set({ nickname: null });
  },
}));
