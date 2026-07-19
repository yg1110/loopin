import { useEffect } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { Globe, Home, User } from 'lucide-react';
import { useSession } from '@/store/session';
import { syncWebPush } from '@/lib/webpush';
import { profileExists } from '@/features/identity/api';
import { InstallBanner } from '@/components/InstallBanner';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { NewHabitScreen } from '@/screens/NewHabitScreen';
import { HabitDetailScreen } from '@/screens/HabitDetailScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { ShareScreen } from '@/screens/ShareScreen';

function RequireNickname() {
  const nickname = useSession((s) => s.nickname);
  if (!nickname) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

const TABS = [
  { to: '/', icon: Home, label: '홈', end: true },
  { to: '/feed', icon: Globe, label: '피드', end: false },
  { to: '/profile', icon: User, label: '프로필', end: false },
];

function TabLayout() {
  const deviceId = useSession((s) => s.deviceId);
  const logout = useSession((s) => s.logout);

  // DB에 프로필이 없으면(삭제됨) 자동 로그아웃 → 온보딩으로
  useEffect(() => {
    profileExists(deviceId).then((exists) => {
      if (exists === false) logout();
    });
  }, [deviceId, logout]);

  useEffect(() => {
    syncWebPush(deviceId);
  }, [deviceId]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-center border-b border-gray-100 bg-white/90 backdrop-blur">
        <span className="text-lg font-bold text-blue-500">Loopin</span>
      </header>
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <InstallBanner />
      <nav className="sticky bottom-0 z-10 flex border-t border-gray-100 bg-white">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-400 aria-[current=page]:text-blue-500"
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen max-w-md bg-gray-50 shadow-sm">
        <Routes>
          <Route element={<RequireNickname />}>
            <Route element={<TabLayout />}>
              <Route index element={<HomeScreen />} />
              <Route path="feed" element={<FeedScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
            <Route path="new-habit" element={<NewHabitScreen />} />
            <Route path="habit/:id" element={<HabitDetailScreen />} />
            <Route path="post/:id" element={<PostDetailScreen />} />
            <Route path="share" element={<ShareScreen />} />
          </Route>
          <Route path="onboarding" element={<OnboardingScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
