import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FabAction = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** 원형 버튼 배경 (Tailwind 클래스) */
  color: string;
};

/**
 * 우하단 + 버튼. 누르면 동작 버튼들이 + 주위로 하나씩(순차 지연) 떠오른다.
 * 다시 누르거나 배경/ESC 로 닫힌다.
 */
export function FabMenu({ actions }: { actions: FabAction[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* 배경 딤 — 열렸을 때만 클릭 가능 */}
      <button
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-10 bg-gray-900/20 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--fab-bottom)] z-20">
        <div className="mx-auto flex max-w-md flex-col items-end gap-3 px-4">
          {/* 위로 하나씩 떠오르는 원형 버튼들 (아래쪽이 먼저) */}
          {actions.map((action, i) => {
            const delay = open ? (actions.length - 1 - i) * 60 : i * 40;
            return (
              <div
                key={action.label}
                style={{ transitionDelay: `${delay}ms` }}
                className={`flex items-center gap-2.5 transition-all duration-200 ease-out ${
                  open
                    ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none translate-y-4 scale-75 opacity-0'
                }`}
              >
                <span className="rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                  {action.label}
                </span>
                <button
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                  tabIndex={open ? 0 : -1}
                  aria-label={action.label}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg active:scale-95 ${action.color}`}
                >
                  <action.icon size={24} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '닫기' : '추가'}
            aria-expanded={open}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-200 active:scale-95"
          >
            <Plus
              size={30}
              className={`transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`}
            />
          </button>
        </div>
      </div>
    </>
  );
}
