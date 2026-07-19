import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Flame } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { dayKeysFor, useCompletions, useHabits } from '@/features/habits/hooks';
import { useCreatePost } from '@/features/feed/hooks';
import { todayKey } from '@/utils/day';
import { computeStreaks } from '@/utils/streak';

export function ShareScreen() {
  const [params] = useSearchParams();
  const habitId = params.get('habitId') ?? '';
  const navigate = useNavigate();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const createPost = useCreatePost();
  const fileRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const habit = habitsQ.data?.find((h) => h.id === habitId);
  const { current } = computeStreaks(dayKeysFor(completionsQ.data, habitId));

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function onShare() {
    if (!habit) return;
    setError(null);
    try {
      await createPost.mutateAsync({
        post: {
          habitName: habit.name,
          streakCount: current,
          caption: caption.trim() || null,
          dayKey: todayKey(),
        },
        imageFile: file,
      });
      navigate('/feed', { replace: true });
    } catch (err) {
      setError('공유 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  if (!habit) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="인증 공유" />
        <p className="py-24 text-center text-sm text-gray-400">습관 정보를 불러오지 못했어요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="인증 공유" />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
          <span className="text-3xl">{habit.emoji ?? '⭐'}</span>
          <div>
            <p className="text-[17px] font-bold text-gray-900">{habit.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-orange-600">
              <Flame size={14} className="fill-orange-500 stroke-orange-500" />
              {current}일 연속
            </p>
          </div>
        </div>

        <label className="mt-2 text-sm font-semibold text-gray-700">한마디 (선택)</label>
        <textarea
          className="min-h-20 rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="오늘의 인증에 한마디 남겨보세요"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
          disabled={createPost.isPending}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">사진 (선택)</label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            <img src={preview} alt="" className="aspect-[4/3] w-full rounded-xl bg-gray-100 object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="py-1 text-sm text-red-500"
            >
              사진 제거
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={createPost.isPending}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-6 text-gray-500"
          >
            <Camera size={22} />
            사진 추가
          </button>
        )}

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          onClick={onShare}
          disabled={createPost.isPending}
          className="mt-4 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {createPost.isPending ? '공유 중…' : '피드에 공유'}
        </button>
      </div>
    </div>
  );
}
