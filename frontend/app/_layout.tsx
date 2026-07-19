import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { queryClient } from '@/lib/queryClient';
import { registerForPushNotifications } from '@/lib/notifications';
import { profileExists } from '@/features/identity/api';
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

/** DB에 프로필이 없으면(삭제됨) 자동 로그아웃 → 온보딩 */
function useSessionVerify() {
  const ready = useSession((s) => s.ready);
  const deviceId = useSession((s) => s.deviceId);
  const nickname = useSession((s) => s.nickname);
  const logout = useSession((s) => s.logout);

  useEffect(() => {
    if (!ready || !deviceId || !nickname) return;
    profileExists(deviceId).then((exists) => {
      if (exists === false) logout();
    });
  }, [ready, deviceId, nickname, logout]);
}

/** 닉네임 확정 후 푸시 토큰 등록 + 알림 탭 시 해당 게시물로 이동 */
function usePushNotifications() {
  const deviceId = useSession((s) => s.deviceId);
  const nickname = useSession((s) => s.nickname);
  const router = useRouter();

  useEffect(() => {
    if (deviceId && nickname) {
      registerForPushNotifications(deviceId);
    }
  }, [deviceId, nickname]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const postId = response.notification.request.content.data?.postId;
      if (typeof postId === 'string') {
        router.push(`/post/${postId}`);
      }
    });
    return () => sub.remove();
  }, [router]);
}

export default function RootLayout() {
  const ready = useSession((s) => s.ready);
  const bootstrap = useSession((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useAuthGate();
  useSessionVerify();
  usePushNotifications();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="new-habit"
            options={{ presentation: 'modal', headerShown: true, title: '새 습관' }}
          />
          <Stack.Screen name="habit/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="post/[id]" options={{ headerShown: true, title: '게시물' }} />
          <Stack.Screen
            name="share"
            options={{ presentation: 'modal', headerShown: true, title: '인증 공유' }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
