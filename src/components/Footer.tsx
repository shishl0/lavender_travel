"use client";
import { useTranslation } from "react-i18next";
import { SiteSettingsDTO } from "@/types/cms";
import { track } from "@/lib/track";

export default function Footer({ settings }: { settings: SiteSettingsDTO | null }) {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const locale = i18n.language;

  const onIg = () => track("click_instagram", { place: "footer", locale });
  const onWa = () => track("click_whatsapp", { place: "footer", locale });

  return (
    <footer className="mt-10 border-t">
      <div className="container py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-gray-600">{t("footer.copy", { year })}</div>
        <div className="flex items-center gap-4">
          <a
            href={settings?.instagramUrl ?? "https://www.instagram.com/lavender_travel_kz"}
            target="_blank"
            className="underline"
            rel="noreferrer"
            onClick={onIg}
          >
            {t("footer.instagram")}
          </a>
          <a
            href={`https://wa.me/${settings?.whatsappNumber ?? "77080086191"}`}
            target="_blank"
            className="underline"
            rel="noreferrer"
            onClick={onWa}
          >
            {t("footer.whatsapp")}
          </a>
        </div>
      </div>
    </footer>
  );
}