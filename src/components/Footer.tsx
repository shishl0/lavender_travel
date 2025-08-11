"use client";

import {useTranslation} from "react-i18next";

export default function Footer(){
  const {t} = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t">
      <div className="container py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-gray-600">
          {t("footer.copy", {year})}
        </div>
        <div className="flex items-center gap-4">
          <a href="https://www.instagram.com/lavender_travel_kz" target="_blank" className="underline">{t("footer.instagram")}</a>
          <a href="https://wa.me/77080086191" target="_blank" className="underline">{t("footer.whatsapp")}</a>
        </div>
      </div>
    </footer>
  );
}