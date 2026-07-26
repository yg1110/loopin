import { BookOpen, ListChecks, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { FabMenu } from '@/components/FabMenu';
import { HabitCard } from '@/components/HabitCard';
import { habitStatus, useCompletions, useHabits, useToggleToday } from '@/features/habits/hooks';

export function HomeScreen() {
  const navigate = useNavigate();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const toggle = useToggleToday();

  const loading = habitsQ.isLoading || completionsQ.isLoading;
  const habits = habitsQ.data ?? [];

  async function onToggle(habitId: string, doneToday: boolean) {
    await toggle.mutateAsync({ habitId, done: doneToday });
    if (!doneToday) {
      if (window.confirm('오늘 완료! 🎉 인증을 피드에 공유할까요?')) {
        navigate(`/share?habitId=${habitId}`);
      }
    }
  }

  return (
    <div className="relative min-h-full">
      <div className="flex flex-col gap-2.5 p-4">
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : habits.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="아직 습관이 없어요"
            subtitle="오른쪽 아래 + 버튼으로 습관을 만들거나 일기를 써보세요."
          />
        ) : (
          habits.map((habit) => {
            const { doneToday, current } = habitStatus(completionsQ.data, habit.id);
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                doneToday={doneToday}
                current={current}
                toggling={toggle.isPending && toggle.variables?.habitId === habit.id}
                onToggle={() => onToggle(habit.id, doneToday)}
                onOpen={() => navigate(`/habit/${habit.id}`)}
              />
            );
          })
        )}
      </div>

      <FabMenu
        actions={[
          {
            icon: BookOpen,
            label: '일기 쓰기',
            color: 'bg-violet-500',
            onClick: () => navigate('/new-diary'),
          },
          {
            icon: ListChecks,
            label: '습관 추가',
            color: 'bg-emerald-500',
            onClick: () => navigate('/new-habit'),
          },
        ]}
      />
    </div>
  );
}
