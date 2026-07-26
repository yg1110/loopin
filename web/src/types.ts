export type Profile = {
  deviceId: string;
  nickname: string;
  createdAt: string;
};

export type Habit = {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  createdAt: string;
  archivedAt?: string | null;
};

export type Completion = {
  id: string;
  habitId: string;
  dayKey: string;
  createdAt: string;
};

/** 피드 게시물 종류: 습관 인증 / 공유 일기 */
export type PostKind = 'habit' | 'diary';

export type FeedPost = {
  id: string;
  ownerId: string;
  nickname: string;
  kind: PostKind;
  /** kind='habit' 일 때만 존재 */
  habitName?: string | null;
  streakCount: number;
  /** kind='diary' 일 때만 존재 */
  title?: string | null;
  /** kind='diary': 날씨 코드 (@/lib/weather) */
  weather?: string | null;
  /** kind='diary': 일기 날짜 'YYYY-MM-DD' */
  entryDate?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  dayKey: string;
  createdAt: string;
  commentCount: number;
};

export type Comment = {
  id: string;
  postId: string;
  nickname: string;
  body: string;
  createdAt: string;
};
