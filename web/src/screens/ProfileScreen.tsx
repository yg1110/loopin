import { useState } from 'react';
import { Bell, BellRing, LogOut, User } from 'lucide-react';
import { useSession } from '@/store/session';
import { enableWebPush, isPushSupported, pushPermission } from '@/lib/webpush';

export function ProfileScreen() {
  const nickname = useSession((s) => s.nickname);
  const deviceId = useSession((s) => s.deviceId);
  const logout = useSession((s) => s.logout);
  const [perm, setPerm] = useState(pushPermission());
  const [busy, setBusy] = useState(false);

  function onLogout() {
    if (window.confirm('로그아웃할까요? 이 기기의 닉네임 정보가 초기화됩니다.')) {
      logout();
    }
  }

  async function onEnable() {
    setBusy(true);
    try {
      await enableWebPush(deviceId);
    } finally {
      setPerm(pushPermission());
      setBusy(false);
    }
  }

  const granted = perm === 'granted';
  const supported = isPushSupported();

  return (
    <div className="flex flex-col items-center gap-4 px-5 py-16">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500">
        <User size={44} className="text-white" />
      </div>
      <p className="text-xl font-bold text-gray-900">{nickname ?? '프로필'}</p>

      <div className="mt-4 w-full">
        {!supported ? (
          <p className="text-center text-sm text-gray-400">이 브라우저는 알림을 지원하지 않아요.</p>
        ) : granted ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-semibold text-green-600">
            <BellRing size={18} />
            알림이 켜져 있어요
          </div>
        ) : (
          <button
            onClick={onEnable}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            <Bell size={18} />
            {busy ? '설정 중…' : '댓글 알림 켜기'}
          </button>
        )}
        <p className="mt-2 text-center text-xs text-gray-400">
          내 게시물에 댓글이 달리면 알림을 받아요.
          <br />
          (iOS는 홈 화면에 추가 후 사용)
        </p>
      </div>

      <button
        onClick={onLogout}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 text-[15px] font-semibold text-gray-600"
      >
        <LogOut size={18} />
        로그아웃
      </button>
    </div>
  );
}
