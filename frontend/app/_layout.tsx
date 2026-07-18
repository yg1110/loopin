import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '@/store/session';

/** bootstrap 완료 후 닉네임 유무에 따라 온보딩/탭으로 라우팅 */
function useAuthGate() {
  const ready = useSession((s) => s.ready);
  const nickname = useSession((s) => s.nickname);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!nickname && !inOnboarding) {
      router.replace('/onboarding');
    } else if (nickname && inOnboarding) {
      router.replace('/');
    }
  }, [ready, nickname, segments, router]);
}

export default function RootLayout() {
  const ready = useSession((s) => s.ready);
  const bootstrap = useSession((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useAuthGate();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
