import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import { ensureProfile } from '@/features/identity/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSession } from '@/store/session';

const MIN = 2;
const MAX = 20;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const deviceId = useSession((s) => s.deviceId);
  const setNickname = useSession((s) => s.setNickname);

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const validLength = trimmed.length >= MIN && trimmed.length <= MAX;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validLength) {
      setError(`닉네임은 ${MIN}~${MAX}자로 입력해주세요.`);
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase가 설정되지 않았습니다. web/.env를 확인해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await ensureProfile(deviceId, trimmed);
      if (!result.ok) {
        setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
        return;
      }
      setNickname(trimmed);
      navigate('/', { replace: true });
    } catch (err) {
      setError('등록 중 오류가 발생했어요. 네트워크를 확인해주세요.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center overflow-y-auto px-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500">
          <RotateCw size={40} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-900">Loopin에 오신 걸 환영해요</h1>
        <p className="mb-3 text-center text-[15px] text-gray-500">
          피드에 표시될 닉네임을 정해주세요.
        </p>

        <input
          className="rounded-xl border border-gray-300 px-4 py-3.5 text-base outline-none focus:border-blue-500"
          placeholder="닉네임"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX}
          autoCapitalize="off"
          autoCorrect="off"
          disabled={submitting}
        />

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={!validLength || submitting}
          className="mt-2 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '시작하기'}
        </button>
      </form>
    </div>
  );
}
