import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { usePost, useCreatePost, useUpdatePost } from '@/features/feed/hooks';
import { WEATHERS } from '@/lib/weather';
import { useSession } from '@/store/session';
import { todayKey } from '@/utils/day';

const TITLE_MAX = 40;
const BODY_MAX = 2000;

/** 일기 작성(/new-diary)과 수정(/post/:id/edit)을 함께 담당한다. */
export function DiaryFormScreen() {
  const { id = '' } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const deviceId = useSession((s) => s.deviceId);

  const postQ = usePost(id);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost(id);
  const saving = createPost.isPending || updatePost.isPending;
  const fileRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(todayKey());
  const [weather, setWeather] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드: 기존 값 채우기
  const loaded = postQ.data;
  useEffect(() => {
    if (!editing || !loaded) return;
    setDate(loaded.entryDate ?? loaded.dayKey);
    setWeather(loaded.weather ?? null);
    setTitle(loaded.title ?? '');
    setBody(loaded.caption ?? '');
    setExistingImage(loaded.imageUrl ?? null);
  }, [editing, loaded]);

  const canSubmit = title.trim().length > 0 && !!date && !saving;
  const shownImage = preview ?? (imageRemoved ? null : existingImage);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setImageRemoved(false);
    }
  }

  function onRemoveImage() {
    setFile(null);
    setPreview(null);
    if (existingImage) setImageRemoved(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError('제목과 날짜를 입력해주세요.');
      return;
    }
    try {
      if (editing) {
        await updatePost.mutateAsync({
          post: {
            title: title.trim(),
            weather,
            entryDate: date,
            caption: body.trim() || null,
            dayKey: date,
          },
          imageFile: file,
          removeImage: imageRemoved,
        });
        navigate(`/post/${id}`, { replace: true });
      } else {
        await createPost.mutateAsync({
          post: {
            kind: 'diary',
            title: title.trim(),
            weather,
            entryDate: date,
            caption: body.trim() || null,
            dayKey: date,
          },
          imageFile: file,
        });
        navigate('/feed', { replace: true });
      }
    } catch (err) {
      setError(editing ? '수정 중 오류가 발생했어요.' : '일기를 올리는 중 오류가 발생했어요.');
      console.error(err);
    }
  }

  if (editing) {
    if (postQ.isLoading) {
      return (
        <div className="flex h-full flex-col">
          <PageHeader title="일기 수정" />
          <p className="py-24 text-center text-sm text-gray-400">불러오는 중…</p>
        </div>
      );
    }
    if (!loaded || loaded.kind !== 'diary' || loaded.ownerId !== deviceId) {
      return (
        <div className="flex h-full flex-col">
          <PageHeader title="일기 수정" />
          <p className="py-24 text-center text-sm text-gray-400">
            {!loaded ? '일기를 찾을 수 없어요.' : '내가 쓴 일기만 수정할 수 있어요.'}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={editing ? '일기 수정' : '일기 쓰기'} />
      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <label className="mt-2 text-sm font-semibold text-gray-700">날짜</label>
        <input
          type="date"
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          value={date}
          max={todayKey()}
          onChange={(e) => setDate(e.target.value)}
          disabled={saving}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">날씨 (선택)</label>
        <div className="flex flex-wrap gap-2">
          {WEATHERS.map((w) => (
            <button
              key={w.code}
              type="button"
              onClick={() => setWeather(weather === w.code ? null : w.code)}
              disabled={saving}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${
                weather === w.code
                  ? 'border-blue-500 bg-blue-50 font-semibold text-blue-600'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-base">{w.emoji}</span>
              {w.label}
            </button>
          ))}
        </div>

        <label className="mt-2 text-sm font-semibold text-gray-700">제목</label>
        <input
          className="rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="예: 오랜만에 한강 산책"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          disabled={saving}
        />

        <label className="mt-2 text-sm font-semibold text-gray-700">본문</label>
        <textarea
          className="min-h-40 rounded-xl border border-gray-300 px-3.5 py-3 text-base outline-none focus:border-blue-500"
          placeholder="오늘 있었던 일을 남겨보세요"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          disabled={saving}
        />
        <p className="text-right text-xs text-gray-400">
          {body.length}/{BODY_MAX}
        </p>

        <label className="mt-2 text-sm font-semibold text-gray-700">사진 (선택)</label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        {shownImage ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={shownImage}
              alt=""
              className="aspect-[4/3] w-full rounded-xl bg-gray-100 object-cover"
            />
            <button type="button" onClick={onRemoveImage} className="py-1 text-sm text-red-500">
              사진 제거
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-6 text-gray-500"
          >
            <Camera size={22} />
            사진 추가
          </button>
        )}

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {saving ? '저장 중…' : editing ? '수정 완료' : '피드에 공유'}
        </button>
      </form>
    </div>
  );
}
