import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ensureProfile } from '@/features/identity/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSession } from '@/store/session';

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

export default function OnboardingScreen() {
  const deviceId = useSession((s) => s.deviceId);
  const setNickname = useSession((s) => s.setNickname);

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const validLength = trimmed.length >= NICKNAME_MIN && trimmed.length <= NICKNAME_MAX;

  async function onSubmit() {
    setError(null);
    if (!validLength) {
      setError(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해주세요.`);
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase가 설정되지 않았습니다. frontend/.env를 확인해주세요.');
      return;
    }
    if (!deviceId) {
      setError('기기 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await ensureProfile(deviceId, trimmed);
      if (!result.ok) {
        setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
        return;
      }
      await setNickname(trimmed); // 게이트가 (tabs)로 리다이렉트
    } catch (e) {
      setError('등록 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.logo}>
          <Ionicons name="sync" size={44} color="#fff" />
        </View>
        <Text style={styles.title}>Loopin에 오신 걸 환영해요</Text>
        <Text style={styles.subtitle}>피드에 표시될 닉네임을 정해주세요.</Text>

        <TextInput
          style={styles.input}
          placeholder="닉네임"
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={NICKNAME_MAX}
          editable={!submitting}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (!validLength || submitting) && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={!validLength || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>시작하기</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: '#ef4444', fontSize: 13 },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
