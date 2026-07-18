import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommentItem } from '@/components/CommentItem';
import { EmptyState } from '@/components/EmptyState';
import { usePost } from '@/features/feed/hooks';
import { useComments, useCreateComment } from '@/features/comments/hooks';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postQ = usePost(id);
  const commentsQ = useComments(id);
  const createComment = useCreateComment(id);

  const [text, setText] = useState('');

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await createComment.mutateAsync(body);
    } catch (e) {
      setText(body); // 실패 시 입력 복원
      console.error(e);
    }
  }

  if (postQ.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const post = postQ.data;
  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>게시물을 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={commentsQ.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.post}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.nickname.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nickname}>{post.nickname}</Text>
                <Text style={styles.time}>
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      });
                    } catch {
                      return '';
                    }
                  })()}
                </Text>
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

            <Text style={styles.commentsTitle}>댓글 {post.commentCount}</Text>
          </View>
        }
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListEmptyComponent={
          commentsQ.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <EmptyState icon="chatbubble-outline" title="첫 댓글을 남겨보세요" />
          )
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="댓글 달기..."
          value={text}
          onChangeText={setText}
          maxLength={280}
          editable={!createComment.isPending}
          returnKeyType="send"
          onSubmitEditing={onSend}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || createComment.isPending) && styles.sendDisabled]}
          onPress={onSend}
          disabled={!text.trim() || createComment.isPending}
        >
          {createComment.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>등록</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  muted: { color: '#9ca3af' },
  list: { padding: 16, gap: 4 },
  post: { gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', marginBottom: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  time: { fontSize: 12, color: '#9ca3af' },
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
  commentsTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 6 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
