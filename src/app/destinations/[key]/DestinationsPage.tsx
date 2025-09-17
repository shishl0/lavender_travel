"use client";

import { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import HeroSlideshow from "./HeroSlideshow";
import ClimateTable from "./ClimateTable";
import LiveTime from "./time.client";
import InlineKztRate from "@/components/InlineKztRate";
import Stories from "./stories.client";
import SelectTour from "@/components/SelectTour";

type Lang = "ru" | "kk" | "en";
type L<T = string> = Partial<Record<Lang, T | null>>;
type Basics = {
  timezones?: string[];
  capital?: L<string> | null;
  languages?: L<string[] | null> | null;
  currencyCode?: string | null;
};

type DestinationDTO = {
  id: string;
  key: string;
  isActive: boolean;
  title?: L<string>;
  basics?: Basics | null;
  gallery?: string[] | null;
  heroImages?: string[] | null;
  descriptionHtml?: L<string>;
  cities?: L<string[]>;
  climate?: any;
  faqVisa?: L<string> | string | null;
  faqEntry?: L<string> | string | null;
  faqReturn?: L<string> | string | null;
  poi?: any[] | null;
};

type Settings = {
  whatsappNumber?: string | null;
} & Record<string, any>;

type Months = { airC: (number | null)[]; waterC: (number | null)[]; humidity: (number | null)[] } | null;

function pickL<T>(obj: L<T> | undefined | null, lang: Lang, fb?: T): T | "" {
  if (!obj) return (fb ?? "") as any;
  const v = obj[lang];
  if (v != null) return v as any;
  if (obj.ru != null) return obj.ru as any;
  if (obj.en != null) return obj.en as any;
  if (obj.kk != null) return obj.kk as any;
  return (fb ?? "") as any;
}

function normImages(images?: string[] | null): string[] {
  return (images || [])
    .filter(Boolean)
    .map((u) => {
      const s = String(u).trim();
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("/")) return s;
      return `/${s}`;
    });
}

function safeMonths(climate: any): Months {
  if (!climate) return null;

  const rotate = (arr: (number | null)[], startMonth1to12: number | null) => {
    if (!Array.isArray(arr) || arr.length !== 12 || !startMonth1to12) return arr;
    const out: (number | null)[] = Array(12).fill(null);
    for (let i = 0; i < 12; i++) {
      const monthNum = ((startMonth1to12 - 1 + i) % 12);
      out[monthNum] = arr[i] ?? null;
    }
    return out;
  };

  if (climate.months && typeof climate.months === "object") {
    const m = climate.months as any;
    const to12 = (a: any) =>
      Array.from({ length: 12 }, (_, i) => {
        const v = Number(a?.[i]);
        return Number.isFinite(v) ? v : null;
      });

    const startISO: string | null =
      climate.meta?.era?.window?.[0] ||
      climate.meta?.marine?.window?.[0] ||
      null;
    const startMonth = startISO ? Number(String(startISO).slice(5, 7)) : null;

    return {
      airC: rotate(to12(m.airC), startMonth),
      waterC: rotate(to12(m.waterC), startMonth),
      humidity: rotate(to12(m.humidity), startMonth),
    };
  }

  if (Array.isArray(climate)) {
    const airC = Array(12).fill(null) as (number | null)[];
    const water = Array(12).fill(null) as (number | null)[];
    const hum = Array(12).fill(null) as (number | null)[];
    for (const p of climate) {
      const m = Number(p?.m ?? p?.month ?? p?.mm);
      if (!Number.isInteger(m) || m < 1 || m > 12) continue;
      const i = m - 1;
      const num = (x: any) => (Number.isFinite(Number(x)) ? Number(x) : null);
      airC[i] = num(p?.airC ?? p?.air ?? p?.t ?? p?.temperature);
      water[i] = num(p?.waterC ?? p?.sst ?? p?.water);
      hum[i] = num(p?.humidity ?? p?.rh);
    }
    return { airC, waterC: water, humidity: hum };
  }

  return null;
}

function htmlFromLocalized(
  html: L<string> | string | null | undefined,
  lang: Lang
): string {
  if (!html) return "";
  if (typeof html === "string") return html;
  return (pickL(html, lang, "") as string) || "";
}

export default function DestinationsPage({
  dto,
  settings,
  waDigitsForForm,
}: {
  dto: DestinationDTO;
  settings: Settings | null;
  waDigitsForForm: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = ((i18n.language || "ru").slice(0, 2) as Lang) || "ru";

  const title = pickL(dto.title, lang, dto.key);
  const basics = dto.basics || null;

  const zonesAll = Array.isArray(basics?.timezones) ? basics!.timezones : [];
  const heroImages = useMemo(
    () => normImages(dto.heroImages?.length ? dto.heroImages : dto.gallery || []),
    [dto.heroImages, dto.gallery]
  );

  // climate -> months
  const months = useMemo(() => safeMonths(dto.climate), [dto.climate]);

  return (
    <>
      <Hero images={heroImages} title={title} />

      {/* контейнер уже, карточки перекрывают hero */}
      <main className="mx-auto max-w-7xl px-4 md:px-6 -mt-32 md:-mt-40 pb-28">
        <section className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl bg-white/85 backdrop-blur border border-slate-200 p-6 md:p-7 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              {t("destination.time.title", "Актуальное время")}
            </h2>
            {zonesAll.length ? (
              <Suspense fallback={<div className="h-10 w-52 animate-pulse rounded bg-slate-100" />}>
                <LiveTime zones={zonesAll} locale={lang === "en" ? "en-US" : lang === "kk" ? "kk-KZ" : "ru-RU"} />
              </Suspense>
            ) : (
              <div className="text-sm text-slate-500">
                {t("destination.time.empty", "Часовые пояса не выбраны")}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/85 backdrop-blur border border-slate-200 p-6 md:p-7 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              {t("destination.info.title", "Справочные данные")}
            </h2>
            <ul className="grid gap-2 text-[15px]">
              <li>
                <b>{t("destination.info.capital", "Столица:")}</b>{" "}
                {pickL(basics?.capital, lang, t("common.na", "—")) || t("common.na", "—")}
              </li>
              <li>
                <b>{t("destination.info.languages", "Языки:")}</b>{" "}
                {(pickL(basics?.languages, lang, []) as string[]).join(", ") || t("common.na", "—")}
              </li>
              <li>
                <b>{t("destination.info.currency", "Валюта:")}</b>{" "}
                <InlineKztRate code={basics?.currencyCode} destId={dto.id} destKey={dto.key} />
              </li>
            </ul>
          </div>
        </section>

        {/* Описание / города */}
        <section className="mt-20 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr]">
            <article
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{
                __html: pickL(dto.descriptionHtml, lang, ""),
              }}
            />
            <aside>
              <h3 className="text-base font-semibold mb-3">
                {t("destination.cities.title", "Города")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(pickL(dto.cities, lang, []) as string[]).map((c) => (
                  <span key={c} className="inline-flex items-center rounded-2xl border px-3 py-1.5 text-sm bg-slate-50">
                    {c}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Климат */}
        {months && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-3">
              {t("climate.title", "Климат по месяцам")}
            </h2>
            <ClimateTable
              airC={months.airC}
              waterC={months.waterC}
              humidity={months.humidity}
              // t с дефолтом для подписей внутри таблицы
              t={(k: string, fb: string) => t(k, fb)}
            />
          </section>
        )}

        {/* FAQ — визы/въезд/возврат */}
        {(dto.faqVisa || dto.faqEntry || dto.faqReturn) && (
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            <PrettyCard
              icon="🛂"
              title={t("destination.faq.visa", "Виза")}
              html={htmlFromLocalized(dto.faqVisa, lang)}
              emptyLabel={t("destination.faq.empty", "нет данных")}
            />
            <PrettyCard
              icon="🛬"
              title={t("destination.faq.entry", "Условия въезда")}
              html={htmlFromLocalized(dto.faqEntry, lang)}
              emptyLabel={t("destination.faq.empty", "нет данных")}
            />
            <PrettyCard
              icon="🛫"
              title={t("destination.faq.return", "Условия возвращения")}
              html={htmlFromLocalized(dto.faqReturn, lang)}
              emptyLabel={t("destination.faq.empty", "нет данных")}
            />
          </section>
        )}

        {/* Достопримечательности — сторисы */}
        {dto.poi?.length ? (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">
              {t("destination.poi.title", "Достопримечательности")}
            </h2>
            <Stories items={dto.poi!} />
          </section>
        ) : null}
      </main>

      {/* Финальный CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
          <h2 className="font-extrabold text-[clamp(24px,1.1rem+1.4vw,32px)] text-[#101828]">
            {t("destination.cta.pick.title", "Готовы подобрать тур?")}
          </h2>
          <div className="mt-5">
            <SelectTour
              align="center"
              waDigits={waDigitsForForm}
              label={t("hero.ctaPrimary", "Выбрать тур")}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- UI bits (client) ---------------- */

function Hero({ images, title }: { images: string[]; title: string }) {
  return (
    <div className="relative">
      <div className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0 scale-110 animate-[heroIn_0.25s_ease-out_forwards]">
          <HeroSlideshow images={images} className="h-full rounded-2xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
      </div>
    </div>
  );
}

function PrettyCard({
  title,
  html,
  icon,
  emptyLabel,
}: {
  title: string;
  html: string;
  icon: string;
  emptyLabel: string;
}) {
  const has = Boolean(html && html.trim());
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition-shadow">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-xl">{icon}</div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {has ? (
        <article
          className="prose prose-slate max-w-none text-[15px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-slate-400 text-sm">{emptyLabel}</div>
      )}
    </div>
  );
}
