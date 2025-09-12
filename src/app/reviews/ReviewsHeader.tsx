"use client";

import { useTranslation } from "react-i18next";

export default function ReviewsHeader() {
  const { t } = useTranslation();
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("reviews.title", "Отзывы")}
      </h1>
      <p className="mt-1 text-slate-600">
        {t(
          "reviews.subtitle",
          "Спасибо, что делитесь впечатлениями — это помогает другим путешественникам."
        )}
      </p>
    </header>
  );
}

