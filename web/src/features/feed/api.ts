import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { FeedPost, PostKind } from '@/types';

type FeedRow = {
  id: string;
  owner_id: string;
  kind: PostKind | null;
  habit_name: string | null;
  streak_count: number;
  title: string | null;
  weather: string | null;
  entry_date: string | null;
  caption: string | null;
  image_url: string | null;
  day_key: string;
  created_at: string;
  nickname: string;
  comment_count: number;
};

function mapFeed(r: FeedRow): FeedPost {
  return {
    id: r.id,
    ownerId: r.owner_id,
    nickname: r.nickname,
    // kind 컬럼이 없던 시절 데이터/마이그레이션 이전 상태 대비 기본값 habit
    kind: r.kind ?? 'habit',
    habitName: r.habit_name,
    streakCount: r.streak_count,
    title: r.title,
    weather: r.weather,
    entryDate: r.entry_date,
    caption: r.caption,
    imageUrl: r.image_url,
    dayKey: r.day_key,
    createdAt: r.created_at,
    commentCount: Number(r.comment_count ?? 0),
  };
}

export async function fetchFeed(limit = 50): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as FeedRow[]).map(mapFeed);
}

export async function fetchPost(id: string): Promise<FeedPost | null> {
  const { data, error } = await supabase.from('feed_posts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapFeed(data as FeedRow) : null;
}

/** File을 post-images 버킷에 업로드하고 public URL 반환. */
export async function uploadPostImage(deviceId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${deviceId}/${uuidv4()}.${ext}`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

export type CreatePostInput = {
  kind: PostKind;
  /** kind='habit' 필수 */
  habitName?: string | null;
  streakCount?: number;
  /** kind='diary' 필수 */
  title?: string | null;
  weather?: string | null;
  entryDate?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  dayKey: string;
};

export async function createPost(ownerId: string, input: CreatePostInput): Promise<void> {
  const { error } = await supabase.from('posts').insert({
    owner_id: ownerId,
    kind: input.kind,
    habit_name: input.habitName ?? null,
    streak_count: input.streakCount ?? 0,
    title: input.title ?? null,
    weather: input.weather ?? null,
    entry_date: input.entryDate ?? null,
    caption: input.caption ?? null,
    image_url: input.imageUrl ?? null,
    day_key: input.dayKey,
  });
  if (error) throw error;
}

const IMAGE_BUCKET = 'post-images';

/** public URL에서 버킷 내부 경로(`{device_id}/{uuid}.jpg`)를 뽑는다. 못 뽑으면 null. */
function imagePathFromUrl(url: string): string | null {
  const marker = `/${IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * 게시물 삭제. 댓글은 FK on delete cascade 로 함께 지워진다.
 * 첨부 사진은 스토리지에서 best-effort 로 지운다(실패해도 삭제는 성공 처리).
 */
export async function deletePost(id: string, imageUrl?: string | null): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;

  if (!imageUrl) return;
  const path = imagePathFromUrl(imageUrl);
  if (!path) return;
  const { error: storageError } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  if (storageError) console.warn('[Loopin] 사진 삭제 실패(게시물은 삭제됨):', storageError);
}

export type UpdatePostInput = {
  title?: string | null;
  weather?: string | null;
  entryDate?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  dayKey?: string;
};

/** 게시물 수정 (일기 필드 위주). 전달된 필드만 반영한다. */
export async function updatePost(id: string, input: UpdatePostInput): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title ?? null;
  if (input.weather !== undefined) patch.weather = input.weather ?? null;
  if (input.entryDate !== undefined) patch.entry_date = input.entryDate ?? null;
  if (input.caption !== undefined) patch.caption = input.caption ?? null;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl ?? null;
  if (input.dayKey !== undefined) patch.day_key = input.dayKey;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from('posts').update(patch).eq('id', id);
  if (error) throw error;
}
