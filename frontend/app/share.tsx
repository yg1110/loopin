import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  dayKeysFor,
  useCompletions,
  useHabits,
} from '@/features/habits/hooks';
import { useCreatePost } from '@/features/feed/hooks';
import { todayKey } from '@/utils/day';
import { computeStreaks } from '@/utils/streak';

export default function ShareScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();
  const habitsQ = useHabits();
  const completionsQ = useCompletions();
  const createPost = useCreatePost();

  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const habit = habitsQ.data?.find((h) => h.id === habitId);
  const { current } = computeStreaks(dayKeysFor(completionsQ.data, habitId ?? ''));

  async function pickImage() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  }

  async function onShare() {
    if (!habit) return;
    setError(null);
    try {
      await createPost.mutateAsync({
        post: {
          habitName: habit.name,
          streakCount: current,
          caption: caption.trim() || null,
          dayKey: todayKey(),
        },
        imageBase64: image?.base64,
      });
      router.replace('/feed');
    } catch (e) {
      setError('공유 중 오류가 발생했어요. 네트워크를 확인해주세요.');
      console.error(e);
    }
  }

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>습관 정보를 불러오지 못했어요.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.emoji}>{habit.emoji ?? '⭐'}</Text>
        <View>
          <Text style={styles.habitName}>{habit.name}</Text>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color="#ea580c" />
            <Text style={styles.streak}>{current}일 연속</Text>
          </View>
        </View>
      </View>

      <Text style={styles.label}>한마디 (선택)</Text>
      <TextInput
        style={styles.input}
        placeholder="오늘의 인증에 한마디 남겨보세요"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={280}
        editable={!createPost.isPending}
      />

      <Text style={styles.label}>사진 (선택)</Text>
      {image ? (
        <View>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <Pressable style={styles.removeBtn} onPress={() => setImage(null)}>
            <Text style={styles.removeText}>사진 제거</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.photoBtn} onPress={pickImage} disabled={createPost.isPending}>
          <Ionicons name="camera-outline" size={22} color="#6b7280" />
          <Text style={styles.photoBtnText}>사진 추가</Text>
        </Pressable>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, createPost.isPending && styles.buttonDisabled]}
        onPress={onShare}
        disabled={createPost.isPending}
      >
        {createPost.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>피드에 공유</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  muted: { color: '#9ca3af' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
  },
  emoji: { fontSize: 36 },
  habitName: { fontSize: 17, fontWeight: '700', color: '#111' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  streak: { fontSize: 14, color: '#ea580c' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoBtn: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: { color: '#6b7280', fontSize: 15 },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#f3f4f6' },
  removeBtn: { alignSelf: 'center', paddingVertical: 8 },
  removeText: { color: '#ef4444', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 13 },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
