import { StyleSheet, Text, View } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌐</Text>
      <Text style={styles.title}>피드</Text>
      <Text style={styles.subtitle}>공개 인증 피드 (Phase 3)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 8 },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#6b7280' },
});
