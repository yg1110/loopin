import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'loopin.install_dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari는 beforeinstallprompt 미지원 → 안내만 노출
    if (isIos()) {
      setIosGuide(true);
      setShow(true);
    }

    const onInstalled = () => setShow(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show) return null;

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20">
      <div className="mx-auto max-w-md px-3">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gray-900 p-3 text-white shadow-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500">
            <Download size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">홈 화면에 추가하기</p>
            {iosGuide ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-300">
                공유 <Share size={12} className="inline" /> → “홈 화면에 추가”
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-gray-300">설치하면 알림도 받을 수 있어요</p>
            )}
          </div>
          {!iosGuide ? (
            <button
              onClick={onInstall}
              className="shrink-0 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold"
            >
              추가
            </button>
          ) : null}
          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-white"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
