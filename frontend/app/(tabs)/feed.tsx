import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { FeedCard } from '@/components/FeedCard';
import { useFeed } from '@/features/feed/hooks';

export default function FeedScreen() {
  const router = useRouter();
  const feedQ = useFeed();

  if (feedQ.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={feedQ.data ?? []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      refreshing={feedQ.isRefetching}
      onRefresh={() => feedQ.refetch()}
      renderItem={({ item }) => (
        <FeedCard post={item} onPress={() => router.push(`/post/${item.id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="earth-outline"
          title="아직 게시물이 없어요"
          subtitle="습관을 체크하고 첫 인증을 공유해보세요!"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  list: { padding: 16, gap: 12, flexGrow: 1 },
});
