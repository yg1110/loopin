import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  setCourseVisited,
  type CourseInput,
} from './api';

export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: () => fetchCourses() });
}

export function useCreateCourse() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => createCourse(deviceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useSetCourseVisited() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; visited: boolean }) => setCourseVisited(p.id, p.visited),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}
