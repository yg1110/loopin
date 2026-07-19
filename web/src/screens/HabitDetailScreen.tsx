import { CheckCheck, Flame, Trophy } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { dayKeysFor, useArchiveHabit, useCompletions, useHabits } from '@/features/habits/hooks';
import { computeStreaks } from '@/utils/streak';

export function HabitDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const archive = useArchiveHabit();

  const habit = habitsQ.data?.find((h) => h.id === id);

  if (habitsQ.isLoading || completionsQ.isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="" />
        <p className="py-24 text-center text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="" />
        <p className="py-24 text-center text-sm text-gray-400">습관을 찾을 수 없어요.</p>
      </div>
    );
  }

  const keys = dayKeysFor(completionsQ.data, habit.id);
  const { current, longest } = computeStreaks(keys);

  async function onArchive() {
    if (!habit) return;
    if (window.confirm(`"${habit.name}"을(를) 보관할까요?`)) {
      await archive.mutateAsync(habit.id);
      navigate(-1);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={habit.name} />
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="mt-3 flex flex-col items-center gap-2">
          <span className="text-5xl">{habit.emoji ?? '⭐'}</span>
          <p className="text-xl font-bold text-gray-900">{habit.name}</p>
        </div>

        <div className="flex justify-around">
          <Stat icon={<Flame size={26} className="fill-orange-500 stroke-orange-500" />} value={current} label="현재 연속" />
          <Stat icon={<Trophy size={26} className="fill-amber-400 stroke-amber-400" />} value={longest} label="최장 연속" />
          <Stat icon={<CheckCheck size={26} className="text-blue-500" />} value={keys.length} label="총 완료" />
        </div>

        <button
          onClick={onArchive}
          disabled={archive.isPending}
          className="mt-8 rounded-xl border border-red-200 py-3.5 text-[15px] font-semibold text-red-500"
        >
          습관 보관
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      <span className="text-xl font-bold text-gray-900">{value}</span>
      <span className="text-[13px] text-gray-500">{label}</span>
    </div>
  );
}
