import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/store/session';

export default function ProfileScreen() {
  const nickname = useSession((s) => s.nickname);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🙂</Text>
      <Text style={styles.title}>{nickname ?? '프로필'}</Text>
      <Text style={styles.subtitle}>내 게시물 (Phase 3~4)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 8 },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#6b7280' },
});
