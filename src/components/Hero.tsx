"use client";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { HeroDTO, Locale } from "@/types/cms";
import { track } from "@/lib/track";

type Props = {
  cms: HeroDTO | null;
  waDigits?: string;
};

export default function Hero({ cms, waDigits = "77080086191" }: Props) {
  const { t, i18n } = useTranslation();
  const L = (i18n.language?.slice(0, 2) as Locale) || "ru";
  const pick = (obj: any, fb: string) => obj?.[L] ?? t(fb);

  const onPrimary = () => {
    track("click_hero_primary", { locale: i18n.language });
  };

  const onSecondary = () => {
    track("click_whatsapp", { place: "hero", locale: i18n.language });
  };

  return (
    <section className="section relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-28 w-[44rem] h-[44rem] rounded-full hero-haze" />
      <div className="container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="kicker">{pick(cms?.kicker, "hero.kicker")}</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: "var(--navy)" }}>
            {pick(cms?.titleTop, "hero.titleTop")} <br /> {pick(cms?.titleBottom, "hero.titleBottom")}
          </h1>
          <p className="mt-5 text-[17px] text-gray-700 max-w-xl">
            {pick(cms?.subtitle, "hero.subtitle")}
          </p>
          <div className="mt-8 flex gap-3">
            <a href="#dest" className="btn-primary press" onClick={onPrimary}>
              {pick(cms?.ctaPrimary, "hero.ctaPrimary")}
            </a>
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost press"
              onClick={onSecondary}
            >
              {pick(cms?.ctaSecondary, "hero.ctaSecondary")}
            </a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100">
          <Image
            src={cms?.imageUrl || "/images/hero.jpg"}
            alt={pick(cms?.imageAlt, "hero.imageAlt")}
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