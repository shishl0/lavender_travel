"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function AboutTeaser({
  instagram,
  phone,
}: {
  instagram?: string;
  phone?: string;
}) {
  const { t } = useTranslation();

  const ig = instagram || "https://www.instagram.com/lavender_travel_kz";

  const phoneRaw = phone || "+7 (700) 000-00-00";
  const phoneHref = "tel:" + phoneRaw.replace(/[^\d+]/g, "");

  return (
    <section className="teaser" aria-labelledby="aboutTeaserTitle">
      <div className="container grid md:grid-cols-2 gap-8 items-center">
        {/* ЛЕВО: стеклянная карточка */}
        <div className="about-wrap">
          <div className="about-inner">
            <span className="kicker">{t("aboutTeaser.kicker", "О нас")}</span>

            <h3 id="aboutTeaserTitle" className="about-title">
              {t("aboutTeaser.title", "Lavender Travel — агентство с человеческим подходом")}
            </h3>

            <p className="about-lead">
              {t(
                "aboutTeaser.lead",
                "Подберём и забронируем всё «под ключ». Честные рекомендации, внимание к деталям и сопровождение на каждом шаге."
              )}
            </p>

            <ul className="about-points">
              <li><span className="dot" />{t("aboutTeaser.point1", "Подбор и бронирование «под ключ»")}</li>
              <li><span className="dot" />{t("aboutTeaser.point2", "Честные рекомендации без лишнего")}</li>
              <li><span className="dot" />{t("aboutTeaser.point3", "На связи до вашего возвращения")}</li>
            </ul>

            <div className="about-cta">
              <Link
                href="/about"
                className="btn btn-primary press group"
                aria-label={t("aboutTeaser.moreAria", "Подробнее о компании")}
              >
                <span>{t("aboutTeaser.moreCta", "Подробнее о нас")}</span>
                <svg
                  className="icon transition-transform duration-200 ease-out group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href={ig}
                target="_blank"
                className="btn btn-ghost press"
                aria-label={t("aboutTeaser.instagramAria", "Мы в Instagram")}
              >
                {t("aboutTeaser.instagram", "Instagram")}
              </Link>
            </div>
          </div>
        </div>

        {/* ПРАВО: фото + стеклянная заметка с кнопкой звонка */}
        <div className="about-photo">
          <img
            src="/images/about-teaser.jpg"
            alt={t("aboutTeaser.photoAlt", "Lavender Travel — атмосфера спокойного сервиса")}
            className="about-photo-img"
            loading="lazy"
            decoding="async"
          />
          <div className="about-photo-glow" aria-hidden="true" />
          <div className="about-note">
            <div className="about-note-text">
              <div className="about-note-title">{t("aboutTeaser.noteTitle", "Меньше шума — больше заботы")}</div>
              <div className="about-note-sub">{t("aboutTeaser.noteSub", "Максимум внимания к вашему отдыху.")}</div>
            </div>

            <Link
              href={phoneHref}
              className="about-call-btn press"
              aria-label={t("aboutTeaser.callAria", "Звонок нам: {{phone}}", { phone: phoneRaw })}
            >
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.15a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{t("aboutTeaser.callCta", "Звонок нам")}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}