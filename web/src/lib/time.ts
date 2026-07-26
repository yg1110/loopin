import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/** 'YYYY-MM-DD' → '2026년 7월 26일 (일)' */
export function formatDiaryDate(dayKey?: string | null): string {
  if (!dayKey) return '';
  try {
    return format(parseISO(dayKey), 'yyyy년 M월 d일 (E)', { locale: ko });
  } catch {
    return dayKey;
  }
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
  } catch {
    return '';
  }
}
