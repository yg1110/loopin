import { create } from 'zustand';
import { getOrCreateDeviceId, getStoredNickname, saveNickname } from '@/lib/identity';

type SessionState = {
  deviceId: string | null;
  nickname: string | null;
  /** bootstrap 완료 여부 (라우팅 게이트가 준비될 때까지 대기) */
  ready: boolean;
  bootstrap: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
};

export const useSession = create<SessionState>((set) => ({
  deviceId: null,
  nickname: null,
  ready: false,
  bootstrap: async () => {
    const [deviceId, nickname] = await Promise.all([getOrCreateDeviceId(), getStoredNickname()]);
    set({ deviceId, nickname, ready: true });
  },
  setNickname: async (nickname: string) => {
    await saveNickname(nickname);
    set({ nickname });
  },
}));
