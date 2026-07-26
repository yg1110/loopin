import { supabase } from '@/lib/supabase';
import type { Completion, Habit } from '@/types';

type HabitRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  created_at: string;
  archived_at: string | null;
};

type CompletionRow = { id: string; habit_id: string; day_key: string; created_at: string };

function mapHabit(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    color: r.color,
    createdAt: r.created_at,
    archivedAt: r.archived_at,
  };
}

export async function fetchHabits(ownerId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('owner_id', ownerId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as HabitRow[]).map(mapHabit);
}

export async function fetchCompletions(ownerId: string): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('id,habit_id,day_key,created_at')
    .eq('owner_id', ownerId);
  if (error) throw error;
  return (data as CompletionRow[]).map((r) => ({
    id: r.id,
    habitId: r.habit_id,
    dayKey: r.day_key,
    createdAt: r.created_at,
  }));
}

export type HabitInput = { name: string; emoji?: string | null; color?: string | null };

export async function createHabit(ownerId: string, input: HabitInput): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      owner_id: ownerId,
      name: input.name,
      emoji: input.emoji ?? null,
      color: input.color ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapHabit(data as HabitRow);
}

export async function updateHabit(habitId: string, input: HabitInput): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({
      name: input.name,
      emoji: input.emoji ?? null,
      color: input.color ?? null,
    })
    .eq('id', habitId);
  if (error) throw error;
}

export async function archiveHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', habitId);
  if (error) throw error;
}

export async function toggleToday(params: {
  habitId: string;
  ownerId: string;
  dayKey: string;
  done: boolean;
}): Promise<void> {
  const { habitId, ownerId, dayKey, done } = params;
  if (done) {
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('day_key', dayKey);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('completions')
      .insert({ habit_id: habitId, owner_id: ownerId, day_key: dayKey });
    if (error && error.code !== '23505') throw error;
  }
}
