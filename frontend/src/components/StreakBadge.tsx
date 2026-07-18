import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function StreakBadge({ current }: { current: number }) {
  if (current <= 0) {
    return (
      <View style={[styles.badge, styles.zero]}>
        <Text style={styles.zeroText}>시작 전</Text>
      </View>
    );
  }
  return (
    <View style={styles.badge}>
      <Ionicons name="flame" size={14} color="#ea580c" />
      <Text style={styles.text}>{current}일</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zero: { backgroundColor: '#f3f4f6' },
  text: { color: '#ea580c', fontSize: 13, fontWeight: '600' },
  zeroText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
});
