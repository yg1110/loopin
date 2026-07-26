/** 데이트 코스 분류. DB에는 code 로 저장한다. */
export const COURSE_CATEGORIES = [
  { code: 'food', emoji: '🍽️', label: '맛집', chip: 'bg-rose-50 text-rose-600' },
  { code: 'cafe', emoji: '☕', label: '카페', chip: 'bg-amber-50 text-amber-700' },
  { code: 'culture', emoji: '🎨', label: '전시·문화', chip: 'bg-violet-50 text-violet-600' },
  { code: 'activity', emoji: '🎯', label: '액티비티', chip: 'bg-blue-50 text-blue-600' },
  { code: 'nature', emoji: '🌿', label: '자연·산책', chip: 'bg-emerald-50 text-emerald-600' },
  { code: 'etc', emoji: '📍', label: '기타', chip: 'bg-gray-100 text-gray-600' },
] as const;

export type CourseCategoryCode = (typeof COURSE_CATEGORIES)[number]['code'];

export function findCategory(code?: string | null) {
  return COURSE_CATEGORIES.find((c) => c.code === code) ?? COURSE_CATEGORIES[5];
}

/** 주소·장소명을 네이버 지도 검색으로 연다. */
export function mapSearchUrl(place: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(place)}`;
}

/** 사용자가 프로토콜 없이 입력한 링크도 열리도록 보정. */
export function normalizeLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** 링크를 짧게 보여줄 라벨(호스트명). */
export function linkLabel(link: string): string {
  try {
    return new URL(normalizeLink(link)).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}
