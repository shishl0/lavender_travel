import { notFound } from "next/navigation";
import { getDestinationByKey, getActiveSettings } from "@/lib/cms-cache";
import { Suspense } from "react";
import HeroSlideshow from "./HeroSlideshow";
import ClimateTable from "./ClimateTable";
import LiveTime from "./time.client";
import InlineKztRate from "@/components/InlineKztRate";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Stories from "./stories.client";
import SelectTour from "@/components/SelectTour";

/* ------------ helpers ------------ */
function pickMonths(climate: any):
  | { airC: (number | null)[]; waterC: (number | null)[]; humidity: (number | null)[] }
  | null {
  if (!climate) return null;

  const rotateSeqToJanDec = (arr: (number | null)[], startMonth1to12: number | null) => {
    if (!Array.isArray(arr) || arr.length !== 12 || !startMonth1to12) return arr;
    const out: (number | null)[] = Array(12).fill(null);
    for (let i = 0; i < 12; i++) {
      const monthNum = ((startMonth1to12 - 1 + i) % 12); // 0..11
      out[monthNum] = arr[i] ?? null;
    }
    return out;
  };

  if (climate.months && typeof climate.months === "object") {
    const m = climate.months as any;
    const to12 = (a: any) => Array.from({ length: 12 }, (_, i) => {
      const v = Number(a?.[i]); return Number.isFinite(v) ? v : null;
    });
    const startISO: string | null =
      climate.meta?.era?.window?.[0] ||
      climate.meta?.marine?.window?.[0] ||
      null;
    const startMonth = startISO ? Number(String(startISO).slice(5, 7)) : null;

    return {
      airC: rotateSeqToJanDec(to12(m.airC), startMonth),
      waterC: rotateSeqToJanDec(to12(m.waterC), startMonth),
      humidity: rotateSeqToJanDec(to12(m.humidity), startMonth),
    };
  }

  if (Array.isArray(climate)) {
    const airC  = Array(12).fill(null) as (number | null)[];
    const water = Array(12).fill(null) as (number | null)[];
    const hum   = Array(12).fill(null) as (number | null)[];
    for (const p of climate) {
      const m = Number(p?.m ?? p?.month ?? p?.mm);
      if (!Number.isInteger(m) || m < 1 || m > 12) continue;
      const i = m - 1;
      const num = (x: any) => (Number.isFinite(Number(x)) ? Number(x) : null);
      airC[i]  = num(p?.airC  ?? p?.air ?? p?.t ?? p?.temperature);
      water[i] = num(p?.waterC ?? p?.sst ?? p?.water);
      hum[i]   = num(p?.humidity ?? p?.rh);
    }
    return { airC, waterC: water, humidity: hum };
  }

  return null;
}


/* ============ page ============ */
export default async function DestinationPage(props: { params: Promise<{ key: string }> }) {
  const { key } = await props.params;

  const [dto, settings] = await Promise.all([
    getDestinationByKey(key),
    getActiveSettings().catch(() => null),
  ]);
  if (!dto || !dto.isActive) return notFound();

  // локальный переводчик с фолбэком
  const t = (key: string, fb: string) => fb;

  const title = dto.title?.ru || dto.title?.kk || dto.title?.en || dto.key;
  const basics = dto.basics || null;

  const zonesAll = Array.isArray(basics?.timezones) ? (basics!.timezones as string[]) : [];
  const heroImages = (dto.heroImages?.length ? dto.heroImages : (dto.gallery || [])) as string[];
  const months = pickMonths(dto.climate);

  const waDigitsForForm =
    String(settings?.whatsappNumber || "")
      .replace(/\D/g, "")
      .replace(/^8/, "7") || "77080086191";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header settings={settings} />
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
                {/* локаль времени пока фиксированная; при желании можно тоже вытянуть из i18n */}
                <LiveTime zones={zonesAll} locale="ru-RU" />
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
                {basics?.capital?.ru || basics?.capital?.kk || basics?.capital?.en || t("common.na", "—")}
              </li>
              <li>
                <b>{t("destination.info.languages", "Языки:")}</b>{" "}
                {(basics?.languages?.ru || basics?.languages?.kk || basics?.languages?.en || []).join(", ") ||
                  t("common.na", "—")}
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
                __html: dto.descriptionHtml?.ru || dto.descriptionHtml?.kk || dto.descriptionHtml?.en || "",
              }}
            />
            <aside>
              <h3 className="text-base font-semibold mb-3">
                {t("destination.cities.title", "Города")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(dto.cities?.ru || dto.cities?.kk || dto.cities?.en || []).map((c: string) => (
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
              t={t}
            />
          </section>
        )}

        {/* FAQ-блоки — аккуратные карточки */}
        {(dto.faqVisa || dto.faqEntry || dto.faqReturn) && (
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            <PrettyCard icon="🛂" title={t("destination.faq.visa", "Виза")} html={dto.faqVisa} t={t} />
            <PrettyCard icon="🛬" title={t("destination.faq.entry", "Условия въезда")} html={dto.faqEntry} t={t} />
            <PrettyCard icon="🛫" title={t("destination.faq.return", "Условия возвращения")} html={dto.faqReturn} t={t} />
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

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
          <h2 className="font-extrabold text-[clamp(24px,1.1rem+1.4vw,32px)] text-[#101828]">
            {t("destination.cta.pick.title", "Готовы подобрать тур?")}
          </h2>
          <div className="mt-5">
            <SelectTour align="center" waDigits={waDigitsForForm} label={t("hero.ctaPrimary", "Выбрать тур")} />
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </div>
  );
}


/* ---------------- UI bits ---------------- */

function Hero({ images, title }: { images: string[]; title: string }) {
  const normalized = (images || [])
    .filter(Boolean)
    .map((u) => {
      const s = String(u).trim();
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("/")) return s;
      return `/${s}`;
    });

  return (
    <div className="relative">
      <div className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0 scale-110 animate-[heroIn_0.25s_ease-out_forwards]">
          <HeroSlideshow images={normalized} className="h-full rounded-2xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white drop-shadow">
          <h1 className="text-3xl md:text-5xl font-extrabold">{title}</h1>
        </div>
      </div>
    </div>
  );
}

/* ——— Красивые FAQ-карточки ——— */
function PrettyCard({ title, html, icon, t }: { title: string; html: any; icon: string; t: (k: string, fb: string) => string }) {
  const str = html?.ru || html?.kk || html?.en || "";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xl">{icon}</div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {str ? (
        <article className="prose prose-slate max-w-none text-[15px]" dangerouslySetInnerHTML={{ __html: str }} />
      ) : (
        <div className="text-slate-400 text-sm">
          {t("destination.faq.empty", "нет данных")}
        </div>
      )}
    </div>
  );
}
