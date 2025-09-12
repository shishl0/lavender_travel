"use client";

import { useTranslation } from "react-i18next";

type Unit = "clients" | "years" | "months" | "rating";

export type StatItem = {
  icon: "users" | "globe" | "years" | "star";
  value?: string | number;
  /* необязательно: если указать, берём как есть; иначе локализованный */
  suffix?: string;
  /* необязательно: если указать, берём как есть; иначе локализованный */
  label?: string;
  /* подсказывает выбор суффикса */
  unit?: Unit;
};

const LINKS: Record<StatItem["icon"], string> = {
  users: "/reviews",
  star: "/reviews",
  years: "/about",
  globe: "/destinations",
};

export default function Stats({
  items,
  overHero = true,
  compact = false,
}: {
  items?: StatItem[];
  overHero?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  // Если items не передали — используем локализованные дефолты.
  const data: StatItem[] =
    items ?? [
      { icon: "users", value: "1 200", unit: "clients" },
      { icon: "years", value: "7", unit: "years" },
      { icon: "star", value: "4.8", unit: "rating" },
    ];

  return (
    <section className={`stats ${overHero ? "stats--over-hero" : ""} ${compact ? "stats--compact" : ""}`}>
      <div
        className="stats-wrap"
        role="list"
        aria-label={t("stats.ariaList", "Ключевая статистика")}
      >
        {data.map((s, i) => {
          const href = LINKS[s.icon] || "#";
          // Локализация подписи и суффикса игнорирует пришедшие значения,
          // чтобы динамически переключаться при смене языка.
          const labelText = s.label
            ? s.label
            : s.icon === "users"
              ? t("stats.defaults.clientsLabel", "довольных клиентов")
              : s.icon === "years"
                ? t("stats.defaults.yearsLabel", "в туризме")
                : s.icon === "star"
                  ? t("stats.defaults.ratingLabel", "средняя оценка")
                  : "";

          const unit = s.unit
            ?? (s.icon === "users" ? "clients"
            : s.icon === "star" ? "rating"
            : s.icon === "years" ? "years" : undefined);

          const suffixText = s.suffix ?? (
            unit === "clients" ? t("stats.defaults.clientsSuffix", "+")
            : unit === "months" ? t("stats.defaults.monthsSuffix", " мес.")
            : unit === "rating" ? t("stats.defaults.ratingSuffix", "/5")
            : t("stats.defaults.yearsSuffix", " лет")
          );
          const hasValue = s.value !== undefined && s.value !== null && `${s.value}` !== "";
          return (
            <a
              className="stat-link"
              href={href}
              role="listitem"
              key={i}
              aria-label={t("stats.goto", "Перейти: {{label}}", { label: labelText })}
            >
              <div className="stat-icon" aria-hidden="true">
                <Icon name={s.icon} />
              </div>
              <div className="stat-body">
                <div className="stat-value">
                  {s.value ?? ""}
                  <span className="stat-suffix">{hasValue ? suffixText : ""}</span>
                </div>
                <div className="stat-label">{labelText}</div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ===== Встроенные иконки для статистики ===== */
function Icon({ name }: { name: "users" | "globe" | "years" | "star" }) {
  if (name === "users") {
    return (
      <svg className="stat-svg" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14c1.6 1.6 3.2 2.4 4 2.4s2.4-.8 4-2.4" />
        <path d="M9 10h.01M15 10h.01" />
      </svg>
    );
  }
  if (name === "globe") {
    return (
      <svg className="stat-svg" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15 15 0 0 1 0 20" />
        <path d="M12 2a15 15 0 0 0 0 20" />
      </svg>
    );
  }
  if (name === "years") {
    return (
      <svg className="stat-svg" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  // star
  return (
    <svg className="stat-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 17.3 6.18 3.7-1.64-7.03L21.5 9.2l-7.19-.6L12 2 9.69 8.6 2.5 9.2l4.96 4.77L5.82 21z" />
    </svg>
  );
}
