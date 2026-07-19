import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useCreateHabit } from '@/features/habits/hooks';

const EMOJIS = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '🥗', '😴', '✍️', '🎯'];
const COLORS = ['#eff6ff', '#fef2f2', '#f0fdf4', '#fffbeb', '#faf5ff', '#f0fdfa'];

export function NewHabitScreen() {
  const navigate = useNavigate();
  const createHabit = useCreateHabit();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 30;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError('습관 이름을 입력해주세요 (1~30자).');
      return;
    }
    try {
      await createHabit.mutateAsync({ name: trimmed, emoji, color });
      navigate(-1);
    } catch (err) {
      setError('저장 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="새 습관" />
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
        <label className="mt-2 text-sm font-semibold text-gray-700">이름</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 물 2L 마시기"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          disabled={createHabit.isPending}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">이모지</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl ${
                emoji === e ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mt-2 text-sm font-semibold text-gray-700">색상</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-11 w-11 rounded-xl border-2 ${color === c ? 'border-blue-500' : 'border-gray-200'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={!valid || createHabit.isPending}
          className="mt-4 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {createHabit.isPending ? '추가 중…' : '습관 추가'}
        </button>
      </form>
    </div>
  );
}
