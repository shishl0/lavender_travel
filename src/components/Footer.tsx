"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SiteSettingsDTO } from "@/types/cms";
import { track } from "@/lib/track";

/* ===== Helpers ===== */
const digits = (s = "") => s.replace(/\D+/g, "");
const fmtKZPhone = (raw?: string) => {
  if (!raw) return "";
  let d = digits(raw);
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  if (d.length < 11) return d ? "+" + d : "";
  return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
};

const toTelHref = (raw?: string) => {
  if (!raw) return undefined;
  const d = digits(raw).replace(/^8/, "7");
  if (!d) return undefined;
  return `tel:+${d}`;
};

const toWaHref = (raw?: string) => {
  if (!raw) return undefined;
  const d = digits(raw).replace(/^8/, "7");
  if (d.length < 7) return undefined;
  return `https://wa.me/${d}`;
};

export default function Footer({ settings }: { settings: SiteSettingsDTO | null }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  // ===== DTO (с фолбэками) =====
  const orgName = settings?.brand || "Lavender Travel";
  const instagramUrl = settings?.instagramUrl || "https://www.instagram.com/lavender_travel_kz";
  const phoneNumberRaw = settings?.phoneNumber || "";
  const whatsappNumberRaw = settings?.whatsappNumber || "";

  const phoneDisplay = fmtKZPhone(phoneNumberRaw) || fmtKZPhone(whatsappNumberRaw) || "+7 708 000 00 00";
  const telHref = toTelHref(phoneNumberRaw) || toTelHref(whatsappNumberRaw) || undefined;

  const waHref = toWaHref(whatsappNumberRaw);
  const waDisplay = fmtKZPhone(whatsappNumberRaw);

  // адрес — локализованный (ru → en → kk)
  const addrLoc = settings?.address || null;
  const addressFull =
    addrLoc?.ru || addrLoc?.en || addrLoc?.kk ||
    "050000, Республика Казахстан, г. Алматы, улица Брусиловского, 167";
  const mapHref = `https://maps.google.com/?q=${encodeURIComponent(addressFull)}`;

  const certificateHref = settings?.certificateUrl || null;

  // трекинг
  const onIg = () => track("click_instagram", { place: "footer" });
  const onWa = () => waHref && track("click_whatsapp", { place: "footer", to: waHref });
  const onMap = () => track("click_map", { place: "footer" });
  const onCert = () => certificateHref && track("click_certificate", { place: "footer" });
  const onPrivacy = () => track("click_privacy", { place: "footer" });
  const onTerms = () => track("click_terms", { place: "footer" });
  const onTel = () => telHref && track("click_tel", { place: "footer", to: telHref });

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: orgName,
    sameAs: [instagramUrl, waHref].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: addressFull,
      addressCountry: "KZ",
    },
    telephone: phoneDisplay,
  };

  return (
    <footer className="mt-16 border-t border-[rgba(17,24,39,.08)] bg-[rgb(var(--bg-raw))]">
      {/* Верхняя часть */}
      <div className="container py-10 grid gap-10 md:grid-cols-3 text-[15px] leading-6">
        {/* Col 1 — бренд и соцсети */}
        <div className="space-y-4">
          <div className="font-extrabold text-[18px] text-[var(--navy)]">{orgName}</div>

          <div className="flex items-center gap-3 pt-1">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onIg}
              aria-label={t("footer.instagramAria", "Instagram")}
              className="inline-flex items-center gap-2 rounded-full border-2 border-purple-400 bg-white px-3 py-2 hover:bg-slate-50 transition"
            >
              <InstagramIcon />
              <span className="text-[14px] text-[var(--navy)]">{t("footer.instagram", "Instagram")}</span>
            </a>

            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                onClick={onWa}
                aria-label={t("footer.whatsappAria", "WhatsApp")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-white px-3 py-2 hover:bg-slate-50 transition"
              >
                <WhatsAppIcon />
                <span className="text-[14px] text-emerald-700">{t("footer.whatsapp", "WhatsApp")}</span>
              </a>
            )}
          </div>
        </div>

        {/* Col 2 — контакты */}
        <div className="space-y-4">
          <div className="font-semibold text-[var(--navy)]">{t("footer.contacts", "Контакты")}</div>

          <div className="grid gap-2">
            <div>
              <div className="text-slate-500 text-sm">{t("footer.phone", "Телефон")}</div>
              {telHref ? (
                <a
                  href={telHref}
                  onClick={onTel}
                  className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                >
                  {phoneDisplay}
                </a>
              ) : (
                <span>{phoneDisplay}</span>
              )}
            </div>

            {waHref && (
              <div>
                <div className="text-slate-500 text-sm">WhatsApp</div>
                <a
                  href={waHref}
                  onClick={onWa}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                >
                  {waDisplay || waHref.replace("https://", "")}
                </a>
              </div>
            )}

            <address className="not-italic">
              <div className="text-slate-500 text-sm">{t("footer.address", "Адрес")}</div>
              <a
                href={mapHref}
                target="_blank"
                rel="noreferrer"
                onClick={onMap}
                className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                {addressFull}
              </a>
            </address>
          </div>
        </div>

        {/* Col 3 — ссылки */}
        <nav className="space-y-4">
          <div className="font-semibold text-[var(--navy)]">{t("footer.company", "О компании")}</div>
          <ul className="grid gap-2 text-slate-700">
            <li>
              <Link href="/about" className="hover:underline">
                {t("footer.about", "О нас")}
              </Link>
            </li>
            {certificateHref && (
              <li>
                <a
                  href={certificateHref}
                  className="hover:underline"
                  onClick={onCert}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("footer.certificate", "Сертификат")}
                </a>
              </li>
            )}
            <li>
              <Link href="/legal/privacy" className="hover:underline" onClick={onPrivacy}>
                {t("footer.privacy", "Политика конфиденциальности")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="hover:underline" onClick={onTerms}>
                {t("footer.terms", "Условия обслуживания")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Нижняя полоса */}
      <div className="border-t border-[rgba(17,24,39,.06)] bg-white/60 backdrop-blur-sm">
        <div className="container py-4 text-sm text-slate-600 flex flex-col md:flex-row gap-2 items-center justify-between">
          <div>{t("footer.copyright", "© {{year}} {{org}}. Все права защищены.", { year, org: orgName })}</div>
        </div>
      </div>

      {/* SEO microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </footer>
  );
}

/* ===== Icons ===== */
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="block">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" className="block">
      <path fill="currentColor" d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}
