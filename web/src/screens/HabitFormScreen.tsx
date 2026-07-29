import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useCreateHabit, useHabits, useUpdateHabit } from '@/features/habits/hooks';

const EMOJIS = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '🥗', '😴', '✍️', '🎯'];
const COLORS = ['#eff6ff', '#fef2f2', '#f0fdf4', '#fffbeb', '#faf5ff', '#f0fdfa'];

/** 습관 추가(/new-habit)와 수정(/habit/:id/edit)을 함께 담당한다. */
export function HabitFormScreen() {
  const { id = '' } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const habitsQ = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit(id);
  const saving = createHabit.isPending || updateHabit.isPending;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJIS[0]);
  const [color, setColor] = useState<string>(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드: 기존 값 채우기
  const habit = editing ? habitsQ.data?.find((h) => h.id === id) : undefined;
  useEffect(() => {
    if (!habit) return;
    setName(habit.name);
    setEmoji(habit.emoji ?? EMOJIS[0]);
    setColor(habit.color ?? COLORS[0]);
  }, [habit]);

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
      if (editing) await updateHabit.mutateAsync({ name: trimmed, emoji, color });
      else await createHabit.mutateAsync({ name: trimmed, emoji, color });
      navigate(-1);
    } catch (err) {
      setError('저장 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  if (editing && habitsQ.isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="습관 수정" />
        <p className="py-24 text-center text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  }
  if (editing && !habitsQ.isLoading && !habit) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="습관 수정" />
        <p className="py-24 text-center text-sm text-gray-400">습관을 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={editing ? '습관 수정' : '새 습관'} />
      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <label className="mt-2 text-sm font-semibold text-gray-700">이름</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 물 2L 마시기"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          disabled={saving}
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
          disabled={!valid || saving}
          className="mt-4 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {saving ? '저장 중…' : editing ? '수정 완료' : '습관 추가'}
        </button>
      </form>
    </div>
  );
}
