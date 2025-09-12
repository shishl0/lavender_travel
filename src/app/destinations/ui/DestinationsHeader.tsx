"use client";

import { useTranslation } from "react-i18next";

export default function DestinationsHeader() {
  const { t } = useTranslation();
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("destinations.title", "Направления")}
      </h1>
    </header>
  );
}

