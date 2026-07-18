import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { HabitCard } from '@/components/HabitCard';
import { habitStatus, useCompletions, useHabits, useToggleToday } from '@/features/habits/hooks';

export default function HomeScreen() {
  const router = useRouter();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const toggle = useToggleToday();

  const loading = habitsQ.isLoading || completionsQ.isLoading;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={habitsQ.data ?? []}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          refreshing={habitsQ.isRefetching || completionsQ.isRefetching}
          onRefresh={() => {
            habitsQ.refetch();
            completionsQ.refetch();
          }}
          renderItem={({ item }) => {
            const { doneToday, current } = habitStatus(completionsQ.data, item.id);
            return (
              <HabitCard
                habit={item}
                doneToday={doneToday}
                current={current}
                toggling={toggle.isPending && toggle.variables?.habitId === item.id}
                onToggle={async () => {
                  const wasDone = doneToday;
                  await toggle.mutateAsync({ habitId: item.id, done: wasDone });
                  if (!wasDone) {
                    Alert.alert('오늘 완료! 🎉', '인증을 피드에 공유할까요?', [
                      { text: '다음에', style: 'cancel' },
                      { text: '공유하기', onPress: () => router.push(`/share?habitId=${item.id}`) },
                    ]);
                  }
                }}
                onPress={() => router.push(`/habit/${item.id}`)}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="leaf-outline"
              title="아직 습관이 없어요"
              subtitle="오른쪽 아래 + 버튼으로 첫 습관을 만들어보세요."
            />
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/new-habit')}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
