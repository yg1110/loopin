import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useCourse, useCreateCourse, useUpdateCourse } from '@/features/courses/hooks';
import { COURSE_CATEGORIES, normalizeLink } from '@/lib/courseCategory';

const NAME_MAX = 40;
const PLACE_MAX = 80;
const LINK_MAX = 500;
const MEMO_MAX = 500;

/** 코스 추가(/new-course)와 수정(/course/:id/edit)을 함께 담당한다. */
export function CourseFormScreen() {
  const { id = '' } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const courseQ = useCourse(id);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(id);
  const saving = createCourse.isPending || updateCourse.isPending;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0].code);
  const [place, setPlace] = useState('');
  const [link, setLink] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 수정 모드: 기존 값 채우기 (최초 로드 1회)
  const loaded = courseQ.data;
  useEffect(() => {
    if (!editing || !loaded) return;
    setName(loaded.name);
    setCategory(loaded.category);
    setPlace(loaded.place ?? '');
    setLink(loaded.link ?? '');
    setMemo(loaded.memo ?? '');
  }, [editing, loaded]);

  const canSubmit = name.trim().length > 0 && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError('코스 이름을 입력해주세요.');
      return;
    }
    const input = {
      name: name.trim(),
      category,
      place: place.trim(),
      link: normalizeLink(link),
      memo: memo.trim(),
    };
    try {
      if (editing) await updateCourse.mutateAsync(input);
      else await createCourse.mutateAsync(input);
      navigate('/course', { replace: true });
    } catch (err) {
      setError('저장 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  if (editing && courseQ.isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="코스 수정" />
        <p className="py-24 text-center text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  }
  if (editing && !courseQ.isLoading && !loaded) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="코스 수정" />
        <p className="py-24 text-center text-sm text-gray-400">코스를 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={editing ? '코스 수정' : '코스 추가'} />
      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <label className="mt-2 text-sm font-semibold text-gray-700">이름</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 성수 파스타집"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          disabled={saving}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">분류</label>
        <div className="flex flex-wrap gap-2">
          {COURSE_CATEGORIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCategory(c.code)}
              disabled={saving}
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
          disabled={saving}
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
          disabled={saving}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">메모 (선택)</label>
        <textarea
          className="min-h-24 rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예약 필요, 주차 가능, 웨이팅 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={MEMO_MAX}
          disabled={saving}
        />

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 rounded-xl bg-pink-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {saving ? '저장 중…' : editing ? '수정 완료' : '코스 저장'}
        </button>
      </form>
    </div>
  );
}
