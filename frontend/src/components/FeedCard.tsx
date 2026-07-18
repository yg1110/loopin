import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedPost } from '@/types';

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
  } catch {
    return '';
  }
}

export function FeedCard({ post, onPress }: { post: FeedPost; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.nickname.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nickname}>{post.nickname}</Text>
          <Text style={styles.meta}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={13} color="#ea580c" />
          <Text style={styles.streakText}>{post.streakCount}일</Text>
        </View>
      </View>

      <Text style={styles.habit}>
        <Text style={styles.habitLabel}>습관 </Text>
        {post.habitName}
      </Text>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.footer}>
        <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
        <Text style={styles.commentCount}>{post.commentCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nickname: { fontSize: 15, fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#9ca3af' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: { color: '#ea580c', fontSize: 13, fontWeight: '600' },
  habit: { fontSize: 15, color: '#111', fontWeight: '600' },
  habitLabel: { color: '#9ca3af', fontWeight: '400', fontSize: 13 },
  caption: { fontSize: 15, color: '#374151', lineHeight: 21 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#f3f4f6' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2 },
  commentCount: { fontSize: 14, color: '#6b7280' },
});
