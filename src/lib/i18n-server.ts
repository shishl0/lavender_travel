import "server-only";
import ru from "@/i18n/translations/ru_translation.json";
import kk from "@/i18n/translations/kk_translation.json";
import en from "@/i18n/translations/en_translation.json";
import { headers, cookies } from "next/headers";

type Locale = "ru" | "kk" | "en";

const resources = {
  ru: ru as Record<string, any>,
  kk: kk as Record<string, any>,
  en: en as Record<string, any>,
} as const;

const LOCALES: Locale[] = ["ru", "kk", "en"];

function fromAcceptLanguage(h?: string | null): Locale | null {
  if (!h) return null;
  const lc = h.toLowerCase();
  if (lc.includes("kk")) return "kk";
  if (lc.includes("en")) return "en";
  if (lc.includes("ru")) return "ru";
  return null;
}

export async function detectLocale(): Promise<Locale> {
  const cStore = await cookies();
  const hStore = await headers();

  const c = cStore.get("i18nextLng")?.value;
  if (c && LOCALES.includes(c as Locale)) return c as Locale;

  const fromHeader = fromAcceptLanguage(hStore.get("accept-language"));
  if (fromHeader) return fromHeader;

  return "ru";
}

function getByPath(obj: any, key: string): any {
  return key.split(".").reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
}

export type ServerT = (key: string, fallback?: string) => string;

export async function getServerT(locale?: Locale): Promise<{ t: ServerT; locale: Locale }> {
  const lang = (locale && LOCALES.includes(locale) ? locale : await detectLocale()) as Locale;
  const dict = resources[lang];

  const t: ServerT = (key, fallback) => {
    const v = getByPath(dict, key);
    if (typeof v === "string") return v;
    return typeof fallback === "string" ? fallback : key;
  };

  return { t, locale: lang };
}

export function numberFmt(locale: Locale = "ru") {
  const map: Record<Locale, string> = { ru: "ru-RU", kk: "kk-KZ", en: "en-US" };
  return new Intl.NumberFormat(map[locale]);
}