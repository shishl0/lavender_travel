"use client";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import SelectTour from "./SelectTour";
import { HeroDTO, Locale } from "@/types/cms";

type Props = { cms: HeroDTO | null; waDigits?: string };

export default function Hero({ cms, waDigits = "77080086191" }: Props) {
  const { t, i18n } = useTranslation();
  const L = (i18n.language?.slice(0, 2) as Locale) || "ru";
  const pick = (obj: any, fb: string) => obj?.[L] ?? t(fb);

  return (
    <section className="hero hero--full">
      <div className="hero-bg">
        <Image
          src={cms?.imageUrl || "/images/hero.jpg"}
          alt={pick(cms?.imageAlt, "hero.imageAlt")}
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="container">
          <div className="kicker">{pick(cms?.kicker, "hero.kicker")}</div>

          <h1 className="hero-title hero-title--onimg mt-3 text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
            {pick(cms?.titleTop, "hero.titleTop")} <br /> {pick(cms?.titleBottom, "hero.titleBottom")}
          </h1>

          <p className="mt-5 text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl">
            {pick(cms?.subtitle, "hero.subtitle")}
          </p>
          <SelectTour
            align="left"
            waDigits={waDigits}
            label={t("hero.ctaPrimary")}
          />
        </div>
      </div>
    </section>
  );
}