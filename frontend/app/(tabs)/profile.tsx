import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/store/session';

export default function ProfileScreen() {
  const nickname = useSession((s) => s.nickname);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={44} color="#fff" />
      </View>
      <Text style={styles.title}>{nickname ?? '프로필'}</Text>
      <Text style={styles.subtitle}>내 게시물 (곧 제공)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#6b7280' },
});
