import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import {
  createCourse,
  deleteCourse,
  fetchCourse,
  fetchCourses,
  setCourseVisited,
  updateCourse,
  type CourseInput,
} from './api';

export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: () => fetchCourses() });
}

export function useCourse(id: string) {
  return useQuery({ queryKey: ['course', id], queryFn: () => fetchCourse(id), enabled: !!id });
}

export function useCreateCourse() {
  const deviceId = useSession((s) => s.deviceId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => createCourse(deviceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => updateCourse(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', id] });
    },
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
