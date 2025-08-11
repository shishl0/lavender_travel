"use client";

import {useTranslation} from "react-i18next";

const feats = [
  { icon:"🧭", key:"individual" },
  { icon:"📞", key:"support"    },
  { icon:"🌍", key:"guides"     },
  { icon:"✓",  key:"prices"     },
] as const;

export default function WhyUs(){
  const {t} = useTranslation();
  return (
    <section id="why" className="section">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold" style={{color:"var(--navy)"}}>
          {t("why.title")}
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {feats.map(f=>(
            <div key={f.key} className="card p-6">
              <div className="text-3xl" style={{color:"var(--lavender)"}}>{f.icon}</div>
              <div className="mt-3 font-semibold">{t(`why.items.${f.key}.title`)}</div>
              <p className="mt-1 text-sm text-gray-600">{t(`why.items.${f.key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}