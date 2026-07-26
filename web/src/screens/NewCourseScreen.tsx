import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useCreateCourse } from '@/features/courses/hooks';
import { COURSE_CATEGORIES, normalizeLink } from '@/lib/courseCategory';

const NAME_MAX = 40;
const PLACE_MAX = 80;
const LINK_MAX = 500;
const MEMO_MAX = 500;

export function NewCourseScreen() {
  const navigate = useNavigate();
  const createCourse = useCreateCourse();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0].code);
  const [place, setPlace] = useState('');
  const [link, setLink] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !createCourse.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError('코스 이름을 입력해주세요.');
      return;
    }
    try {
      await createCourse.mutateAsync({
        name: name.trim(),
        category,
        place: place.trim(),
        link: normalizeLink(link),
        memo: memo.trim(),
      });
      navigate('/course', { replace: true });
    } catch (err) {
      setError('저장 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="코스 추가" />
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
        <label className="mt-2 text-sm font-semibold text-gray-700">이름</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 성수 파스타집"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          disabled={createCourse.isPending}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">분류</label>
        <div className="flex flex-wrap gap-2">
          {COURSE_CATEGORIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCategory(c.code)}
              disabled={createCourse.isPending}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${
                category === c.code
                  ? 'border-blue-500 bg-blue-50 font-semibold text-blue-600'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-base">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        <label className="mt-2 text-sm font-semibold text-gray-700">장소·주소 (선택)</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 서울 성동구 연무장길 00"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          maxLength={PLACE_MAX}
          disabled={createCourse.isPending}
        />
        <p className="text-xs text-gray-400">목록에서 누르면 지도 검색으로 열려요.</p>

        <label className="mt-2 text-sm font-semibold text-gray-700">링크 (선택)</label>
        <input
          type="text"
          inputMode="url"
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="블로그·예약 링크 붙여넣기"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          maxLength={LINK_MAX}
          autoCapitalize="off"
          autoCorrect="off"
          disabled={createCourse.isPending}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">메모 (선택)</label>
        <textarea
          className="min-h-24 rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예약 필요, 주차 가능, 웨이팅 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={MEMO_MAX}
          disabled={createCourse.isPending}
        />

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 rounded-xl bg-pink-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {createCourse.isPending ? '저장 중…' : '코스 저장'}
        </button>
      </form>
    </div>
  );
}
