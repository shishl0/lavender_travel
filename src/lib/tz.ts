export const APP_TZ =
  process.env.APP_TIMEZONE ||
  process.env.APP_TZ ||
  "Asia/Almaty";

/** 2025-08-19 → "19.08" (только метка дня) */
export function dayLabelFromYMD(ymd: string): string {
  const [Y, M, D] = ymd.split("-");
  return `${D}.${M}`;
}

/** 0..23 в выбранной таймзоне */
export function hourInTZ(d: Date | string | number, tz = APP_TZ): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(d));
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(h, 10);
}

/** YYYY-MM-DD в выбранной таймзоне */
export function ymdInTZ(d: Date | string | number, tz = APP_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

/** человекочитаемая дата/время в выбранной таймзоне */
export function formatDateTime(
  d: Date | string | number,
  locale = "ru-RU",
  tz = APP_TZ,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

/** «последние N дней» как массив YYYY-MM-DD в таймзоне */
export function recentDaysYMD(days: number, tz = APP_TZ): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    out.push(ymdInTZ(new Date(now - i * 86400000), tz));
  }
  return out;
}

/** UTC-дата от YYYY-MM-DD (специфика: парсится как UTC 00:00 этого дня) */
export function ymdToUTCDate(ymd: string): Date {
  return new Date(ymd); // стандарт JS: "YYYY-MM-DD" трактуется как UTC
}

/** "00", "01", ... */
export function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}