import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { CourseCard } from '@/components/CourseCard';
import { useCourses, useDeleteCourse, useSetCourseVisited } from '@/features/courses/hooks';
import { COURSE_CATEGORIES } from '@/lib/courseCategory';
import { useSession } from '@/store/session';

type Scope = 'all' | 'mine' | 'todo';

const SCOPES: { code: Scope; label: string }[] = [
  { code: 'all', label: '전체' },
  { code: 'todo', label: '안 가본 곳' },
  { code: 'mine', label: '내가 추가' },
];

export function CourseScreen() {
  const navigate = useNavigate();
  const deviceId = useSession((s) => s.deviceId);
  const coursesQ = useCourses();
  const setVisited = useSetCourseVisited();
  const remove = useDeleteCourse();

  const [scope, setScope] = useState<Scope>('all');
  const [category, setCategory] = useState<string | null>(null);

  const courses = useMemo(() => coursesQ.data ?? [], [coursesQ.data]);
  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (scope === 'mine' && c.ownerId !== deviceId) return false;
        if (scope === 'todo' && c.visited) return false;
        if (category && c.category !== category) return false;
        return true;
      }),
    [courses, scope, category, deviceId],
  );

  const visitedCount = courses.filter((c) => c.visited).length;

  return (
    <div className="relative min-h-full">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-gray-900">데이트 코스</h2>
          {courses.length > 0 ? (
            <p className="text-xs text-gray-400">
              {courses.length}곳 · 가봤어요 {visitedCount}곳
            </p>
          ) : null}
        </div>

        {/* 범위 세그먼트 */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {SCOPES.map((s) => (
            <button
              key={s.code}
              onClick={() => setScope(s.code)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                scope === s.code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 분류 필터 */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              category === null
                ? 'border-blue-500 bg-blue-50 font-semibold text-blue-600'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            전체
          </button>
          {COURSE_CATEGORIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCategory(category === c.code ? null : c.code)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${
                category === c.code
                  ? 'border-blue-500 bg-blue-50 font-semibold text-blue-600'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {coursesQ.isLoading ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={courses.length === 0 ? '아직 코스가 없어요' : '조건에 맞는 코스가 없어요'}
            subtitle={
              courses.length === 0
                ? '오른쪽 아래 + 버튼으로 가고 싶은 곳을 모아보세요.'
                : '다른 필터를 선택해보세요.'
            }
          />
        ) : (
          filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              mine={course.ownerId === deviceId}
              busy={
                (setVisited.isPending && setVisited.variables?.id === course.id) ||
                (remove.isPending && remove.variables === course.id)
              }
              onToggleVisited={() =>
                setVisited.mutate({ id: course.id, visited: !course.visited })
              }
              onEdit={() => navigate(`/course/${course.id}/edit`)}
              onDelete={() => {
                if (window.confirm(`'${course.name}' 코스를 삭제할까요?`)) remove.mutate(course.id);
              }}
            />
          ))
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <button
            onClick={() => navigate('/new-course')}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg active:scale-95"
            aria-label="코스 추가"
          >
            <Plus size={30} />
          </button>
        </div>
      </div>
    </div>
  );
}
