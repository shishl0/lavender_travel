"use client";

import Image from "next/image";
import {useTranslation} from "react-i18next";

export default function Hero(){
  const {t} = useTranslation();
  return (
    <section className="section relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-28 w-[44rem] h-[44rem] rounded-full hero-haze" />
      <div className="container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="kicker">{t("hero.kicker")}</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight" style={{color:"var(--navy)"}}>
            {t("hero.titleTop")} <br/> {t("hero.titleBottom")}
          </h1>
          <p className="mt-5 text-[17px] text-gray-700 max-w-xl">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex gap-3">
            <a href="#dest" className="btn-primary press">{t("hero.ctaPrimary")}</a>
            <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost press">{t("hero.ctaSecondary")}</a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100">
          <Image
            src="/images/hero.jpg"
            alt={t("hero.imageAlt")}
            width={1200}
            height={900}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}