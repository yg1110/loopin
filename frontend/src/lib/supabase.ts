import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** .env 값이 플레이스홀더/누락이면 false. UI에서 안내 배너 등에 사용. */
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes('YOUR-PROJECT') && !anonKey.includes('YOUR-ANON-KEY');

if (!isSupabaseConfigured) {
  console.warn(
    '[Loopin] Supabase 미설정: frontend/.env 에 EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY 를 채우세요.',
  );
}

// auth 미사용: 세션 영속/자동갱신 비활성. AsyncStorage는 supabase-js 요구사항 충족용.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'anon', {
  auth: {
    storage: AsyncStorage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
