"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SelectTour from "@/components/SelectTour";
import ReviewsTeaser from "@/components/reviews/ReviewsTeaser";
import checklistIcon from "./checklist.svg";
import globalIcon from "./global.svg";
import passportIcon from "./passport.svg";
import fireIcon from "./fire.svg";
import { useTranslation } from "react-i18next";

// ---------- helpers ----------
type Locale = "ru" | "kk" | "en";
const toLocale = (lng?: string): Locale => (lng?.startsWith("kk") ? "kk" : lng?.startsWith("en") ? "en" : "ru");

const digits = (s: string) => s.replace(/\D+/g, "");
const fmtKZPhone = (raw?: string) => {
  if (!raw) return "";
  let d = digits(raw);
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  if (d.length < 11) return "+" + d;
  return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
};
const extractInstagramUser = (url?: string) => {
  if (!url) return "";
  const u = url
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .trim();
  return u || "";
};
function pickLocale<
  T extends { ru?: string | null; kk?: string | null; en?: string | null } | null | undefined
>(l: T, locale: Locale = "ru"): string {
  if (!l) return "";
  const v = (l as any)[locale] ?? (l as any).ru ?? (l as any).en ?? (l as any).kk;
  return typeof v === "string" ? v : "";
}
const fmtInt = (n: number | null | undefined, nf: Intl.NumberFormat, na: string) =>
  typeof n === "number" && Number.isFinite(n) ? nf.format(n) : na;

type Settings = any; // можешь подставить свой тип

export default function AboutClient({ settings }: { settings: Settings }) {
  const { t, i18n } = useTranslation();
  const locale = toLocale(i18n.language);

  const nf = new Intl.NumberFormat(
    locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU"
  );

  const clients = settings?.statsClients ?? null;

  const phone = settings?.phoneNumber?.trim() || "";
  const whatsapp = settings?.whatsappNumber?.trim() || "";

  const instagram = settings?.instagramUrl?.trim() || "";
  const address = pickLocale(settings?.address, locale);
  const certUrl = settings?.certificateUrl || "";
  const brand = (settings as any)?.brand || "Lavender Travel";

  const phoneNice = fmtKZPhone(phone);
  const phoneHref = phone ? `tel:${digits(phone).replace(/^8/, "7").replace(/^7/, "+7")}` : undefined;
  const waHref = whatsapp ? `https://wa.me/${digits(whatsapp).replace(/^8/, "7")}` : undefined;
  const igUser = extractInstagramUser(instagram);
  const igHref = igUser ? `https://instagram.com/${igUser}` : undefined;

  // безопасные фолбэки для контактов
  const phoneDisplay = phoneNice || (whatsapp ? fmtKZPhone(whatsapp) : "");
  const phoneLink =
    phoneHref ||
    (whatsapp ? `tel:${digits(whatsapp).replace(/^8/, "7").replace(/^7/, "+7")}` : undefined);

  const waDisplay = whatsapp ? fmtKZPhone(whatsapp) : "";
  const igDisplay = igUser ? `@${igUser}` : "";
  const addressDisplay = address || "";

  const mapEmbedUrl =
    settings?.mapEmbedUrl?.trim() ||
    "https://maps.google.com/maps?q=almaty&t=&z=13&ie=UTF8&iwloc=&output=embed";

  const waDigitsForForm = digits(whatsapp).replace(/^8/, "7") || "77080086191";

  // FAQ — тексты через i18n-ключи
  const faqItems: { icon: ReactNode; q: string; a: string }[] = [
    {
      icon: <Image src={checklistIcon} alt="" width={36} height={36} className="h-9 w-9" />,
      q: t("about.faq.q1", "Что входит в тур?"),
      a: t("about.faq.a1", "Перелёт, трансфер, проживание, питание по выбранной системе, страховка и сопровождение."),
    },
    {
      icon: <Image src={globalIcon} alt="" width={36} height={36} className="h-9 w-9" />,
      q: t("about.faq.q2", "Можно всё оформить онлайн?"),
      a: t("about.faq.a2", "Да. Договор, оплата и документы — дистанционно. Билеты и ваучеры пришлём за 1–2 дня до вылета."),
    },
    {
      icon: <Image src={passportIcon} alt="" width={36} height={36} className="h-9 w-9" />,
      q: t("about.faq.q3", "Поможете с визой?"),
      a: t("about.faq.a3", "Подскажем документы, запишем в визовый центр, сделаем брони и страховку."),
    },
    {
      icon: <Image src={fireIcon} alt="" width={36} height={36} className="h-9 w-9" />,
      q: t("about.faq.q4", "Как отслеживать «горящие»?"),
      a: t("about.faq.a4", "Оставьте желаемые даты/страны — пришлём лучшие варианты."),
    },
  ];

  return (
    <>
      {/* Header/Footer у тебя уже клиентские, поэтому они и реагировали на смену языка */}
      <Header settings={settings} />

      {/* ===== HERO ===== */}
      <section
        className="relative overflow-clip"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 12% -10%, rgba(123,77,187,.18), transparent 60%), radial-gradient(1200px 600px at 100% 0%, rgba(94,59,183,.12), transparent 60%), linear-gradient(180deg, #F2F0FF 0%, #F6F4FF 100%)",
        }}
      >
        <div className="relative mx-auto max-w-[92rem] px-4 sm:px-6 py-16 md:py-20">
          <p className="text-[12px] tracking-[.18em] uppercase font-semibold text-[#7B4DBB]">
            {t("about.hero.kicker", "О компании")}
          </p>

          <h1 className="mt-2 text-[clamp(28px,1.2rem+2.6vw,44px)] font-extrabold text-[#101828] drop-shadow-[0_6px_24px_rgba(0,0,0,.12)]">
            {t("about.hero.title", "Отдых без хлопот — мы берём всё на себя")}
          </h1>

          <p className="mt-3 max-w-[58ch] text-[15.5px] leading-7 text-slate-600">
            {brand} {t("about.hero.works", "работает")}{" "}
           {settings?.inTourismSinceISO
                ? t("about.hero.sinceYear", {
                    y: new Date(settings.inTourismSinceISO).getFullYear(),
                    defaultValue: "с {{y}} года.",
                    })
                : t("about.hero.forYou", "для вас.")
                }{" "}
          </p>

          {/* мини-статы */}
          <div className="mt-6">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-[transform,box-shadow,border-color,filter] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(13,20,34,.12)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#7B4DBB]/25 bg-[#7B4DBB]/10 text-[#7B4DBB]">
                  <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-[17px] font-extrabold text-[#1B1F3B]">
                    {fmtInt(clients, nf, t("common.na", "—"))}
                    {clients ? t("stats.defaults.clientsSuffix", "+") : ""}
                  </div>
                  <div className="text-[13px] text-slate-500">
                    {t("about.stats.happyTourists", "довольных туристов")}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-[transform,box-shadow,border-color,filter] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(13,20,34,.12)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#7B4DBB]/25 bg-[#7B4DBB]/10 text-[#7B4DBB]">
                  <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-[17px] font-extrabold text-[#1B1F3B]">24/7</div>
                  <div className="text-[13px] text-slate-500">{t("about.stats.support", "поддержка")}</div>
                </div>
              </div>

              <a
                href={certUrl || "#docs"}
                className="relative flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-[transform,box-shadow,border-color,filter] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(13,20,34,.12)]"
                target={certUrl ? "_blank" : undefined}
                rel={certUrl ? "noopener noreferrer" : undefined}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#7B4DBB]/25 bg-[#7B4DBB]/10 text-[#7B4DBB]">
                  <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-[17px] font-extrabold text-[#1B1F3B]">
                    {t("about.stats.official", "Официально")}
                  </div>
                  <div className="text-[13px] text-slate-500">
                    {certUrl ? t("about.stats.certs", "лицензии и сертификаты") : t("about.stats.certificateSoon", "сертификат скоро будет")}
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY ===== */}
      <section id="why" className="py-16 md:py-20">
        <div className="mx-auto max-w-[92rem] px-4 sm:px-6">
          <h2 className="text-center font-extrabold text-[clamp(24px,1.1rem+1.4vw,32px)] text-[#101828]">
            {t("about.why.title", "Почему нас выбирают")}
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "🛡️", h: t("about.why.card1.title", "Только проверенные туроператоры"), p: t("about.why.card1.text", "Работаем с надёжными партнёрами и страховыми компаниями. Гарантируем соответствие отелей заявленному уровню.") },
              { emoji: "💬", h: t("about.why.card2.title", "Поддержка 24/7"), p: t("about.why.card2.text", "На связи круглосуточно: поможем с перелётом, трансфером, заселением и любыми вопросами по туру.") },
              { emoji: "💳", h: t("about.why.card3.title", "Всё оформляем онлайн"), p: t("about.why.card3.text", "Договор, оплата и документы — дистанционно. Экономим ваше время и делаем процесс прозрачным.") },
              { emoji: "🔥", h: t("about.why.card4.title", "Сильные цены и «горящие»"), p: t("about.why.card4.text", "Ищем выгодные варианты и спец-предложения. Предупреждаем о скидках по выбранным направлениям.") },
            ].map((c) => (
              <article
                key={c.h}
                className="group h-[260px] rounded-[18px] p-[1px] [background:linear-gradient(135deg,#9C79E2_0%,#7B4DBB_48%,#5E3BB7_100%)] shadow-[0_6px_18px_rgba(123,77,187,.16)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
              >
                <div className="flex h-full flex-col rounded-[18px] border border-slate-100 bg-white/95 p-4 backdrop-blur-[2px]">
                  <div className="inline-grid h-[42px] w-[42px] place-items-center rounded-[12px] border border-[#7B4DBB]/20 bg-[#7B4DBB]/10 text-[#1b1f3b] shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
                    <span className="text-[22px] leading-none">{c.emoji}</span>
                  </div>
                  <h3 className="mt-3 text-[15.5px] font-extrabold text-[#101828]">{c.h}</h3>
                  <p className="mt-1 line-clamp-5 text-[13.5px] leading-6 text-slate-600">{c.p}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SAFETY / GUARANTEES ===== */}
      <section id="safety" className="py-16 md:py-20">
        <div className="mx-auto max-w-[92rem] px-4 sm:px-6">
          <div className="rounded-[22px] p-[1px] shadow-[0_8px_22px_rgba(27,31,59,.10)] [background:linear-gradient(135deg,#9C79E2_0%,#7B4DBB_48%,#5E3BB7_100%)]">
            <div className="rounded-[22px] border border-slate-100 bg-white/95 p-6 backdrop-blur-[3px]">
              <h2 className="text-[clamp(22px,1rem+1vw,28px)] font-extrabold text-[#101828]">{t("about.safety.title", "Безопасность и гарантии — в приоритете")}</h2>
              <p className="mt-2 max-w-[70ch] text-[15.5px] leading-7 text-slate-600">
                {t("about.safety.text", "Мы сопровождаем вас на каждом этапе: от подбора тура до возвращения домой. Если что-то идёт не по плану — мы уже на связи и решаем вопрос.")}
              </p>
              <ul className="mt-4 grid gap-2 text-[15px] text-[#3f485c]">
                {[t("about.safety.point1", "Контроль качества — интересуемся отдыхом каждого клиента"),
                  t("about.safety.point2", "Детальные памятки по странам, визам и страховкам"),
                  t("about.safety.point3", "Открытая политика возвратов и изменений")].map((txt) => (
                  <li key={txt} className="flex items-center">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#7B4DBB] shadow-[0_0_0_3px_rgba(123,77,187,.12)]" />
                    {txt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DOCS & CERT ===== */}
      <section id="docs" className="py-16 md:py-20">
        <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2">
          {/* Сертификат: планшет/десктоп */}
          <div className="hidden sm:block relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(16,24,40,.06)]">
            <div className="relative h-[440px] overflow-hidden">
              <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(123,77,187,.18),rgba(123,77,187,0))] blur-2xl" />
              <div className="pointer-events-none absolute -right-14 -bottom-24 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(94,59,183,.12),rgba(94,59,183,0))] blur-2xl" />
              {certUrl ? (
                /\.pdf(?:$|\?)/i.test(certUrl) ? (
                  <iframe
                    title={t("about.docs.certificatePdf", "Сертификат (PDF)")}
                    src={`${certUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="absolute inset-x-0 top-0 h-[520px] w-full -translate-y-6 border-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pointer-events-none"
                  />
                ) : (
                  <>
                    <Image
                      src={certUrl}
                      alt={t("about.docs.certificateScan", "Скан сертификата")}
                      fill
                      className="object-contain object-center select-none"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <div className="absolute inset-0 z-10" aria-hidden />
                  </>
                )
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#f4f4ff] to-[#f6f7ff] text-slate-500">
                  {t("about.docs.certificatePlaceholder", "Скан сертификата появится после загрузки в CMS")}
                </div>
              )}

              <div className="absolute inset-x-4 bottom-4 z-20 flex items-center justify-between gap-3 rounded-[14px] border border-slate-200/70 bg-white/70 p-3 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,.12)]">
                <div className="truncate text-[13px] font-semibold text-black">{t("about.docs.certificate", "Сертификат")}</div>
                <a
                  href={certUrl || "#"}
                  target={certUrl ? "_blank" : undefined}
                  rel={certUrl ? "noopener noreferrer" : undefined}
                  className={`inline-flex h-10 items-center gap-2 rounded-[12px] px-3 text-sm font-medium text-black transition ${
                    certUrl
                      ? "border border-slate-300 bg-white/80 hover:bg-white hover:shadow-sm hover:text-black/90"
                      : "pointer-events-none border border-slate-200 bg-white/40 text-slate-400"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {certUrl ? t("about.docs.openFile", "Открыть файл") : t("about.docs.noFile", "Нет файла")}
                </a>
              </div>
            </div>
          </div>

          {/* Документы — список */}
          <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(16,24,40,.06)]">
            <h3 className="text-[18px] font-extrabold text-[#101828]">{t("about.docs.title", "Документы")}</h3>

            <div className="mt-4 grid gap-2.5">
              {certUrl ? (
                <a
                  href={certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden group inline-flex h-12 items-center justify-between rounded-full border border-slate-200 bg-white px-4 font-semibold text-[#1B1F3B] shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50"
                >
                  <span>{t("about.docs.certificate", "Сертификат")}</span>
                  <span className="ml-3 grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-slate-300 group-hover:text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </a>
              ) : (
                <span className="sm:hidden inline-flex h-12 items-center justify-between rounded-full border border-slate-200 bg-white/70 px-4 font-semibold text-slate-400">
                  <span>{t("about.docs.certificateNone", "Сертификат (нет файла)")}</span>
                  <span className="ml-3 grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </span>
              )}

              <Link href="/legal/terms" className="group inline-flex h-12 items-center justify-between rounded-full border border-slate-200 bg-white px-4 font-semibold text-[#1B1F3B] shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50">
                <span>{t("about.docs.terms", "Условия обслуживания")}</span>
                <span className="ml-3 grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-slate-300 group-hover:text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </Link>

              <Link href="/legal/privacy" className="group inline-flex h-12 items-center justify-between rounded-full border border-slate-200 bg-white px-4 font-semibold text-[#1B1F3B] shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50">
                <span>{t("about.docs.privacy", "Политика конфиденциальности")}</span>
                <span className="ml-3 grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-slate-300 group-hover:text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              {brand}{" "}
              {settings?.inTourismSinceISO
                ? `• ${t("about.docs.sinceShort", "c")} ${new Date(settings.inTourismSinceISO).getFullYear()} ${t("about.docs.yearShort", "г.")}`
                : ""}{" "}
              • {address || t("about.docs.addressTBD", "Адрес уточняется")}
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS TEASER ===== */}
      <section className="py-12">
        <ReviewsTeaser />
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[92rem] px-4 sm:px-6">
          <h2 className="text-center font-extrabold text-[clamp(24px,1.1rem+1.4vw,32px)] text-[var(--ink)]">
            {t("about.faq.title", "Частые вопросы")}
          </h2>

          <div className="mt-8 grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-2xl p-[1px] [background:linear-gradient(135deg,rgba(var(--accent-rgb),.32)_0%,rgba(var(--accent-rgb),.12)_45%,rgba(var(--accent-rgb),.32)_100%)] shadow-[var(--shadow-lg)]">
                <div className="rounded-2xl border border-[rgba(17,24,39,.06)] bg-[var(--color-surface)] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div className="min-w-0">
                      <h3 className="mb-1 text-[15.5px] font-semibold text-[var(--navy)]">{item.q}</h3>
                      <p className="text-[15px] leading-7 text-[var(--muted)]">{item.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACTS ===== */}
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-extrabold text-[#101828]">{t("about.contacts.title", "Связаться с нами")}</h3>

            <div className="mt-3 grid gap-2 text-[15px] text-slate-700">
              {phoneDisplay ? (
                <div>
                  {t("about.contacts.phone", "Телефон")}:{" "}
                  {phoneLink ? <a className="text-indigo-600 underline-offset-2 hover:underline" href={phoneLink}>{phoneDisplay}</a> : <span>{phoneDisplay}</span>}
                </div>
              ) : null}

              {waDisplay ? (
                <div>
                  {t("about.contacts.whatsapp", "WhatsApp")}:{" "}
                  {waHref ? (
                    <a className="text-indigo-600 underline-offset-2 hover:underline" href={waHref} target="_blank" rel="noopener noreferrer">
                      {waDisplay}
                    </a>
                  ) : (
                    <span>{waDisplay}</span>
                  )}
                </div>
              ) : null}

              {igDisplay ? (
                <div>
                  {t("about.contacts.instagram", "Instagram")}:{" "}
                  {igHref ? (
                    <a className="text-indigo-600 underline-offset-2 hover:underline" href={igHref} target="_blank" rel="noopener noreferrer">
                      {igDisplay}
                    </a>
                  ) : (
                    <span>{igDisplay}</span>
                  )}
                </div>
              ) : null}

              {addressDisplay ? <div>{t("about.contacts.address", "Адрес")}: {addressDisplay}</div> : null}

              {!phoneDisplay && !waDisplay && !igDisplay && !addressDisplay ? (
                <div className="text-slate-500">{t("about.contacts.pending", "Контактные данные уточняются.")}</div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center rounded-full border border-[#5E3BB7]/30
                    bg-gradient-to-tr from-[#9C79E2] via-[#7B4DBB] to-[#5E3BB7]
                    px-5 font-semibold text-white shadow-[0_8px_22px_rgba(123,77,187,.28),inset_0_1px_0_rgba(255,255,255,.25)]
                    transition hover:brightness-105 active:translate-y-[1px] press"
                >
                  {t("about.contacts.ask", "Задать вопрос")}
                </a>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-slate-200 shadow-sm">
            <iframe title={t("about.map.title", "Карта офиса")} src={mapEmbedUrl} className="h-[320px] w-full" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[92rem] px-4 text-center sm:px-6">
          <h2 className="font-extrabold text-[clamp(24px,1.1rem+1.4vw,32px)] text-[#101828]">
            {t("about.final.title", "Поехали отдыхать?")}
          </h2>
          <div className="mt-5">
            <SelectTour align="center" waDigits={waDigitsForForm} label={t("about.final.cta", "Выбрать тур")} />
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}