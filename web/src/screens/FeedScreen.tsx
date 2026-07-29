import { Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { FeedCard } from '@/components/FeedCard';
import { useDeletePost, useFeed } from '@/features/feed/hooks';
import { useSession } from '@/store/session';

export function FeedScreen() {
  const navigate = useNavigate();
  const deviceId = useSession((s) => s.deviceId);
  const feedQ = useFeed();
  const removePost = useDeletePost();
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
          <FeedCard
            key={post.id}
            post={post}
            mine={post.ownerId === deviceId}
            busy={removePost.isPending && removePost.variables?.id === post.id}
            onOpen={() => navigate(`/post/${post.id}`)}
            onDelete={() => {
              const label = post.kind === 'diary' ? '일기를' : '인증을';
              if (window.confirm(`이 ${label} 삭제할까요? 댓글도 함께 사라져요.`))
                removePost.mutate({ id: post.id, imageUrl: post.imageUrl });
            }}
          />
        ))
      )}
    </div>
  );
}
