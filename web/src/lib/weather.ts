/** 일기 날씨 선택지. DB에는 code 문자열로 저장한다. */
export const WEATHERS = [
  { code: 'sunny', emoji: '☀️', label: '맑음' },
  { code: 'cloudy', emoji: '⛅', label: '구름' },
  { code: 'rainy', emoji: '🌧️', label: '비' },
  { code: 'snowy', emoji: '❄️', label: '눈' },
  { code: 'windy', emoji: '💨', label: '바람' },
  { code: 'hot', emoji: '🥵', label: '더움' },
  { code: 'cold', emoji: '🥶', label: '추움' },
] as const;

export type WeatherCode = (typeof WEATHERS)[number]['code'];

export function findWeather(code?: string | null) {
  if (!code) return null;
  return WEATHERS.find((w) => w.code === code) ?? null;
}
