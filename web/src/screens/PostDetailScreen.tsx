import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flame, MessageCircle, Send } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { CommentItem } from '@/components/CommentItem';
import { EmptyState } from '@/components/EmptyState';
import { usePost } from '@/features/feed/hooks';
import { useComments, useCreateComment } from '@/features/comments/hooks';
import { timeAgo } from '@/lib/time';

export function PostDetailScreen() {
  const { id = '' } = useParams();
  const postQ = usePost(id);
  const commentsQ = useComments(id);
  const createComment = useCreateComment(id);
  const [text, setText] = useState('');

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await createComment.mutateAsync(body);
    } catch (err) {
      setText(body);
      console.error(err);
    }
  }

  const post = postQ.data;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="게시물" />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {postQ.isLoading ? (
          <p className="py-24 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : !post ? (
          <p className="py-24 text-center text-sm text-gray-400">게시물을 찾을 수 없어요.</p>
        ) : (
          <div className="p-4">
            <div className="flex flex-col gap-2.5 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                  {post.nickname.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{post.nickname}</p>
                  <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                  <Flame size={13} className="fill-orange-500 stroke-orange-500" />
                  {post.streakCount}일
                </span>
              </div>
              <p className="text-[15px] font-semibold text-gray-900">
                <span className="text-[13px] font-normal text-gray-400">습관 </span>
                {post.habitName}
              </p>
              {post.caption ? (
                <p className="text-[15px] leading-relaxed text-gray-700">{post.caption}</p>
              ) : null}
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="" className="aspect-[4/3] w-full rounded-xl bg-gray-100 object-cover" />
              ) : null}
              <p className="pt-1 text-sm font-bold text-gray-700">댓글 {post.commentCount}</p>
            </div>

            <div>
              {commentsQ.isLoading ? (
                <p className="py-6 text-center text-sm text-gray-400">불러오는 중…</p>
              ) : (commentsQ.data ?? []).length === 0 ? (
                <EmptyState icon={MessageCircle} title="첫 댓글을 남겨보세요" />
              ) : (
                commentsQ.data!.map((c) => <CommentItem key={c.id} comment={c} />)
              )}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={onSend}
        className="flex flex-none items-center gap-2 border-t border-gray-100 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-[15px] outline-none focus:border-blue-500"
          placeholder="댓글 달기..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          disabled={createComment.isPending}
        />
        <button
          type="submit"
          disabled={!text.trim() || createComment.isPending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-50"
          aria-label="댓글 등록"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
