"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SiteSettingsDTO } from "@/types/cms";
import { track } from "@/lib/track";

export default function Footer({ settings }: { settings: SiteSettingsDTO | null }) {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const locale = i18n.language;

  // ===== Defaults & DTO fallbacks =====
  const orgName = settings?.orgName || "Lavender Travel";
  const instagramUrl =
    settings?.instagramUrl || "https://www.instagram.com/lavender_travel_kz";
  const whatsappNumber = settings?.whatsappNumber || "77080086191";
  const phone = settings?.phone || `+${whatsappNumber.startsWith("+") ? "" : ""}${whatsappNumber}`;
  const telHref = `tel:${(settings?.phone || whatsappNumber).replace(/[^\d+]/g, "")}`;
  const email = settings?.email || null;

  const addressFull =
    settings?.address ||
    "050000, Республика Казахстан, г. Алматы, Алмалинский район, улица Брусиловского, дом № 167";
  const mapHref = `https://maps.google.com/?q=${encodeURIComponent(addressFull)}`;

  const foundedAt = settings?.foundedAt || "21.04.2025";
  const privacyHref = settings?.privacyUrl || "/privacy";
  const termsHref = settings?.termsUrl || "/terms";
  const certificateHref = "/about/#certificate";

  // ===== Tracking =====
  const onIg = () => track("click_instagram", { place: "footer", locale });
  const onWa = () =>
    track("click_whatsapp", { place: "footer", locale, to: `https://wa.me/${whatsappNumber}` });
  const onPhone = () => track("click_phone", { place: "footer", locale, phone });
  const onEmail = () => email && track("click_email", { place: "footer", locale, email });
  const onMap = () => track("click_map", { place: "footer", locale });
  const onCert = () => track("click_certificate", { place: "footer", locale });
  const onPrivacy = () => track("click_privacy", { place: "footer", locale });
  const onTerms = () => track("click_terms", { place: "footer", locale });

  // ===== JSON-LD (Organization) =====
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: orgName,
    telephone: phone,
    ...(email ? { email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "улица Брусиловского, дом № 167",
      addressLocality: "Алматы",
      postalCode: "050000",
      addressCountry: "KZ",
    },
    sameAs: [instagramUrl, `https://wa.me/${whatsappNumber}`],
  };

  return (
    <footer className="mt-16 border-t border-[rgba(17,24,39,.08)] bg-[rgb(var(--bg-raw))]">
      {/* верхняя часть */}
      <div className="container py-10 grid gap-10 md:grid-cols-3 text-[15px] leading-6">
        {/* Col 1 — бренд и соцсети */}
        <div className="space-y-3">
          <div className="font-extrabold text-[18px] text-[var(--navy)]">{orgName}</div>

          <div className="flex items-center gap-4 pt-1">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onIg}
              aria-label="Instagram"
              className="underline hover:no-underline text-[var(--color-accent)]"
            >
              {t("footer.instagram", "Instagram")}
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              onClick={onWa}
              aria-label="WhatsApp"
              className="underline hover:no-underline text-emerald-600"
            >
              {t("footer.whatsapp", "WhatsApp")}
            </a>
          </div>
        </div>

        {/* Col 2 — контакты */}
        <div
          className="space-y-3"
          itemScope
          itemType="https://schema.org/Organization"
        >
          <div className="font-semibold text-[var(--navy)]">Контакты</div>
          <address className="not-italic text-slate-700">
            <div className="text-slate-500 text-sm mb-1">Адрес</div>
            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              onClick={onMap}
              className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
              itemProp="address"
            >
              {addressFull}
            </a>
          </address>

          <div className="grid gap-2">
            <div>
              <span className="text-slate-500 text-sm">Телефон</span>
              <div>
                <a
                  href={telHref}
                  onClick={onPhone}
                  className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                  itemProp="telephone"
                >
                  {phone}
                </a>
              </div>
            </div>

            {email && (
              <div>
                <span className="text-slate-500 text-sm">Email</span>
                <div>
                  <a
                    href={`mailto:${email}`}
                    onClick={onEmail}
                    className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    itemProp="email"
                  >
                    {email}
                  </a>
                </div>
              </div>
            )}

            <div className="text-slate-600">
              <span className="text-slate-500 text-sm">Дата создания</span>
              <div>{foundedAt} года</div>
            </div>
          </div>
        </div>

        {/* Col 3 — ссылки */}
        <nav className="space-y-3">
          <div className="font-semibold text-[var(--navy)]">Полезные ссылки</div>
          <ul className="grid gap-2 text-slate-700">
            <li>
              <Link href="/about" className="hover:underline">О компании</Link>
            </li>
            <li>
              <Link href={certificateHref} className="hover:underline" onClick={onCert}>
                Сертификат
              </Link>
            </li>
            <li>
              <Link href={privacyHref} className="hover:underline" onClick={onPrivacy}>
                Политика конфиденциальности
              </Link>
            </li>
            <li>
              <Link href={termsHref} className="hover:underline" onClick={onTerms}>
                Условия обслуживания
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* нижняя полоса */}
      <div className="border-t border-[rgba(17,24,39,.06)] bg-white/60 backdrop-blur-sm">
        <div className="container py-4 text-sm text-slate-600 flex flex-col md:flex-row gap-2 items-center justify-between">
          <div>{t("footer.copy", { year })}</div>
          <div className="opacity-80">
            {/* можно подсветить локаль/язык, если нужно */}
            {orgName} · {addressFull}
          </div>
        </div>
      </div>

      {/* SEO microdata */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </footer>
  );
}