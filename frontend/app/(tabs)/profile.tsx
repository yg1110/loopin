import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/store/session';

export default function ProfileScreen() {
  const nickname = useSession((s) => s.nickname);
  const logout = useSession((s) => s.logout);

  function onLogout() {
    Alert.alert('로그아웃', '로그아웃할까요? 이 기기의 닉네임 정보가 초기화됩니다.', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={44} color="#fff" />
        </View>
        <Text style={styles.title}>{nickname ?? '프로필'}</Text>
        <Text style={styles.subtitle}>내 게시물 (곧 제공)</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#6b7280" />
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 24 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
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
  logoutBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
});
