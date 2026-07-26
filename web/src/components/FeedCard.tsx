import { Flame, MessageCircle } from 'lucide-react';
import type { FeedPost } from '@/types';
import { formatDiaryDate, timeAgo } from '@/lib/time';
import { findWeather } from '@/lib/weather';

/** 습관 인증 / 일기 공통 헤더 (프로필 + 시간 + 우측 배지) */
export function PostHeader({ post }: { post: FeedPost }) {
  const isDiary = post.kind === 'diary';
  const weather = findWeather(post.weather);
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${
          isDiary ? 'bg-violet-500' : 'bg-blue-500'
        }`}
      >
        {post.nickname.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{post.nickname}</p>
        <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
      </div>
      {isDiary ? (
        weather ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">
            <span className="text-sm">{weather.emoji}</span>
            {weather.label}
          </span>
        ) : null
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
          <Flame size={13} className="fill-orange-500 stroke-orange-500" />
          {post.streakCount}일
        </span>
      )}
    </div>
  );
}

/** 습관명 또는 일기 제목 + 날짜 */
export function PostTitle({ post }: { post: FeedPost }) {
  if (post.kind === 'diary') {
    return (
      <div>
        <p className="text-[15px] font-semibold text-gray-900">
          <span className="text-[13px] font-normal text-gray-400">일기 </span>
          {post.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {formatDiaryDate(post.entryDate ?? post.dayKey)}
        </p>
      </div>
    );
  }
  return (
    <p className="text-[15px] font-semibold text-gray-900">
      <span className="text-[13px] font-normal text-gray-400">습관 </span>
      {post.habitName}
    </p>
  );
}

export function FeedCard({ post, onOpen }: { post: FeedPost; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-gray-100 bg-white p-3.5 text-left"
    >
      <PostHeader post={post} />
      <PostTitle post={post} />

      {post.caption ? (
        <p
          className={`text-[15px] leading-relaxed break-words whitespace-pre-line text-gray-700 ${
            post.kind === 'diary' ? 'line-clamp-6' : ''
          }`}
        >
          {post.caption}
        </p>
      ) : null}
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-xl bg-gray-100 object-cover"
        />
      ) : null}

      <div className="flex items-center gap-1.5 pt-0.5 text-gray-500">
        <MessageCircle size={16} />
        <span className="text-sm">{post.commentCount}</span>
      </div>
    </button>
  );
}
