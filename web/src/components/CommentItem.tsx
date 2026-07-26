import type { Comment } from '@/types';
import { timeAgo } from '@/lib/time';

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2.5 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-sm font-bold text-white">
        {comment.nickname.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">{comment.nickname}</span>
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[15px] leading-snug break-words whitespace-pre-line text-gray-700">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
