"use client";

import { useTranslation } from "react-i18next";

type Key = "individual" | "support" | "guides" | "prices";

const feats: { icon: string; key: Key }[] = [
  { icon: "🧭", key: "individual" },
  { icon: "📞", key: "support" },
  { icon: "🌍", key: "guides" },
  { icon: "✓",  key: "prices" },
];

export default function WhyUs() {
  const { t } = useTranslation();

  return (
    <section id="why" className="section">
      <div className="container">
        <h2 className="why-title">{t("why.title")}</h2>

        <div className="why-grid" role="list">
          {feats.map((f) => (
            <article key={f.key} className="why-card" role="listitem" tabIndex={0}>
              <div className="why-border">
                <div className="why-inner">
                  <span className="why-emoji" aria-hidden>{f.icon}</span>
                  <h3 className="why-h3">{t(`why.items.${f.key}.title`)}</h3>
                  <p className="why-p">{t(`why.items.${f.key}.text`)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}