import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  dayKeysFor,
  useArchiveHabit,
  useCompletions,
  useHabits,
} from '@/features/habits/hooks';
import { computeStreaks } from '@/utils/streak';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const archive = useArchiveHabit();

  const habit = habitsQ.data?.find((h) => h.id === id);

  if (habitsQ.isLoading || completionsQ.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>습관을 찾을 수 없어요.</Text>
      </View>
    );
  }

  const keys = dayKeysFor(completionsQ.data, habit.id);
  const { current, longest } = computeStreaks(keys);

  function onArchive() {
    Alert.alert('습관 보관', `"${habit!.name}"을(를) 보관할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '보관',
        style: 'destructive',
        onPress: async () => {
          await archive.mutateAsync(habit!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: habit.name }} />

      <View style={styles.header}>
        <Text style={styles.emoji}>{habit.emoji ?? '⭐'}</Text>
        <Text style={styles.name}>{habit.name}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="flame" size={26} color="#ea580c" />
          <Text style={styles.statValue}>{current}</Text>
          <Text style={styles.statLabel}>현재 연속</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trophy" size={26} color="#f59e0b" />
          <Text style={styles.statValue}>{longest}</Text>
          <Text style={styles.statLabel}>최장 연속</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-done" size={26} color="#3b82f6" />
          <Text style={styles.statValue}>{keys.length}</Text>
          <Text style={styles.statLabel}>총 완료</Text>
        </View>
      </View>

      <Pressable style={styles.archiveBtn} onPress={onArchive} disabled={archive.isPending}>
        <Text style={styles.archiveText}>습관 보관</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  muted: { color: '#9ca3af' },
  header: { alignItems: 'center', gap: 8, marginTop: 12 },
  emoji: { fontSize: 56 },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 13, color: '#6b7280' },
  archiveBtn: {
    marginTop: 'auto',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  archiveText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
