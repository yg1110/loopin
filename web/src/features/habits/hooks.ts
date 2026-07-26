import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import { todayKey } from '@/utils/day';
import { computeStreaks } from '@/utils/streak';
import type { Completion } from '@/types';
import {
  archiveHabit,
  createHabit,
  fetchCompletions,
  fetchHabits,
  toggleToday,
  updateHabit,
  type HabitInput,
} from './api';

export function useHabits() {
  const deviceId = useSession((s) => s.deviceId);
  return useQuery({ queryKey: ['habits', deviceId], queryFn: () => fetchHabits(deviceId) });
}

export function useCompletions() {
  const deviceId = useSession((s) => s.deviceId);
  return useQuery({ queryKey: ['completions', deviceId], queryFn: () => fetchCompletions(deviceId) });
}

export function useCreateHabit() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HabitInput) => createHabit(deviceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', deviceId] }),
  });
}

export function useUpdateHabit(habitId: string) {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HabitInput) => updateHabit(habitId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', deviceId] }),
  });
}

export function useToggleToday() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { habitId: string; done: boolean }) =>
      toggleToday({ habitId: p.habitId, ownerId: deviceId, dayKey: todayKey(), done: p.done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['completions', deviceId] }),
  });
}

export function useArchiveHabit() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => archiveHabit(habitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', deviceId] }),
  });
}

export function dayKeysFor(completions: Completion[] | undefined, habitId: string): string[] {
  return (completions ?? []).filter((c) => c.habitId === habitId).map((c) => c.dayKey);
}

export function habitStatus(completions: Completion[] | undefined, habitId: string) {
  const keys = dayKeysFor(completions, habitId);
  const { current, longest } = computeStreaks(keys);
  return { doneToday: keys.includes(todayKey()), current, longest };
}
