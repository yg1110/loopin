import { Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { FeedCard } from '@/components/FeedCard';
import { useFeed } from '@/features/feed/hooks';

export function FeedScreen() {
  const navigate = useNavigate();
  const feedQ = useFeed();
  const posts = feedQ.data ?? [];

  return (
    <div className="flex flex-col gap-3 p-4">
      {feedQ.isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="아직 게시물이 없어요"
          subtitle="습관 인증이나 일기를 올려보세요!"
        />
      ) : (
        posts.map((post) => (
          <FeedCard key={post.id} post={post} onOpen={() => navigate(`/post/${post.id}`)} />
        ))
      )}
    </div>
  );
}
