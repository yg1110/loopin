import { supabase } from '@/lib/supabase';
import type { DateCourse } from '@/types';

type CourseRow = {
  id: string;
  owner_id: string;
  nickname: string;
  name: string;
  category: string;
  place: string | null;
  link: string | null;
  memo: string | null;
  visited: boolean;
  created_at: string;
};

function mapCourse(r: CourseRow): DateCourse {
  return {
    id: r.id,
    ownerId: r.owner_id,
    nickname: r.nickname,
    name: r.name,
    category: r.category,
    place: r.place,
    link: r.link,
    memo: r.memo,
    visited: r.visited,
    createdAt: r.created_at,
  };
}

export async function fetchCourses(limit = 200): Promise<DateCourse[]> {
  const { data, error } = await supabase
    .from('date_course_list')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as CourseRow[]).map(mapCourse);
}

export type CourseInput = {
  name: string;
  category: string;
  place?: string | null;
  link?: string | null;
  memo?: string | null;
};

export async function createCourse(ownerId: string, input: CourseInput): Promise<void> {
  const { error } = await supabase.from('date_courses').insert({
    owner_id: ownerId,
    name: input.name,
    category: input.category,
    place: input.place || null,
    link: input.link || null,
    memo: input.memo || null,
  });
  if (error) throw error;
}

export async function setCourseVisited(id: string, visited: boolean): Promise<void> {
  const { error } = await supabase.from('date_courses').update({ visited }).eq('id', id);
  if (error) throw error;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('date_courses').delete().eq('id', id);
  if (error) throw error;
}
