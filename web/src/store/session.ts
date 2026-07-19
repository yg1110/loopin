import { create } from 'zustand';
import { clearNickname, getOrCreateDeviceId, getStoredNickname, saveNickname } from '@/lib/identity';

type SessionState = {
  deviceId: string;
  nickname: string | null;
  setNickname: (nickname: string) => void;
  logout: () => void;
};

// localStorage는 동기라 초기값을 바로 채운다 (RN의 async bootstrap 불필요)
export const useSession = create<SessionState>((set) => ({
  deviceId: getOrCreateDeviceId(),
  nickname: getStoredNickname(),
  setNickname: (nickname) => {
    saveNickname(nickname);
    set({ nickname });
  },
  logout: () => {
    clearNickname();
    set({ nickname: null });
  },
}));
