import { Check, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import type { DateCourse } from '@/types';
import { timeAgo } from '@/lib/time';
import { findCategory, linkLabel, mapSearchUrl, normalizeLink } from '@/lib/courseCategory';

export function CourseCard({
  course,
  mine,
  busy,
  onToggleVisited,
  onDelete,
}: {
  course: DateCourse;
  mine: boolean;
  busy?: boolean;
  onToggleVisited: () => void;
  onDelete: () => void;
}) {
  const category = findCategory(course.category);

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-3.5 ${
        course.visited ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${category.chip}`}
        >
          <span className="text-sm">{category.emoji}</span>
          {category.label}
        </span>
        {course.visited ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
            가봤어요
          </span>
        ) : null}
        <span className="flex-1" />
        <button
          onClick={onToggleVisited}
          disabled={busy}
          aria-label={course.visited ? '안 가본 곳으로 표시' : '가봤어요로 표시'}
          aria-pressed={course.visited}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            course.visited ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'
          }`}
        >
          <Check
            size={18}
            strokeWidth={3}
            className={course.visited ? 'text-white' : 'text-transparent'}
          />
        </button>
      </div>

      <p
        className={`text-base font-semibold break-words ${
          course.visited ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}
      >
        {course.name}
      </p>

      {course.place ? (
        <a
          href={mapSearchUrl(course.place)}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-start gap-1.5 text-sm break-words text-gray-600 underline decoration-gray-300"
        >
          <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
          {course.place}
        </a>
      ) : null}

      {course.link ? (
        <a
          href={normalizeLink(course.link)}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-sm break-all text-blue-600"
        >
          <ExternalLink size={15} className="shrink-0" />
          {linkLabel(course.link)}
        </a>
      ) : null}

      {course.memo ? (
        <p className="text-sm leading-relaxed break-words whitespace-pre-line text-gray-600">
          {course.memo}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5 pt-0.5 text-xs text-gray-400">
        <span>{course.nickname}</span>
        <span>·</span>
        <span>{timeAgo(course.createdAt)}</span>
        {mine ? (
          <>
            <span className="flex-1" />
            <button
              onClick={onDelete}
              disabled={busy}
              aria-label="코스 삭제"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400"
            >
              <Trash2 size={15} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
