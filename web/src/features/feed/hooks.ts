import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import {
  createPost,
  deletePost,
  fetchFeed,
  fetchPost,
  updatePost,
  uploadPostImage,
  type CreatePostInput,
  type UpdatePostInput,
} from './api';

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: () => fetchFeed(50) });
}

export function usePost(id: string) {
  return useQuery({ queryKey: ['post', id], queryFn: () => fetchPost(id), enabled: !!id });
}

export function useUpdatePost(id: string) {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      post: UpdatePostInput;
      /** 새로 고른 사진 (있으면 업로드해 교체) */
      imageFile?: File | null;
      /** 기존 사진 제거 */
      removeImage?: boolean;
    }) => {
      const patch = { ...input.post };
      if (input.imageFile) patch.imageUrl = await uploadPostImage(deviceId, input.imageFile);
      else if (input.removeImage) patch.imageUrl = null;
      await updatePost(id, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', id] });
    },
  });
}

/** 게시물 삭제. 사진이 있으면 스토리지 파일도 함께 정리한다. */
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; imageUrl?: string | null }) => deletePost(p.id, p.imageUrl),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.removeQueries({ queryKey: ['post', p.id] });
      qc.removeQueries({ queryKey: ['comments', p.id] });
    },
  });
}

export function useCreatePost() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { post: CreatePostInput; imageFile?: File | null }) => {
      let imageUrl = input.post.imageUrl ?? null;
      if (input.imageFile) {
        imageUrl = await uploadPostImage(deviceId, input.imageFile);
      }
      await createPost(deviceId, { ...input.post, imageUrl });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
