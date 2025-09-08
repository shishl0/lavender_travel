"use client";

import Image from "next/image";

export type Lang = "ru" | "kk" | "en";

type L = Partial<Record<Lang, string>>;
type Data = {
  kicker: L;
  titleTop: L;
  titleBottom: L;
  subtitle: L;
  imageUrl: string | null;
  imageAlt: L;
};

function t(l: L, lang: Lang): string {
  return l?.[lang] ?? l?.ru ?? l?.en ?? l?.kk ?? "";
}

export default function HeroPreview({
  data,
  lang,
}: {
  data: Data;
  lang: Lang;
}) {
  return (
    <section className="hero hero--full relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Фоновое изображение */}
      <div className="hero-bg absolute inset-0">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={t(data.imageAlt, lang) || "Hero background"}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-slate-100 text-slate-400 text-sm">
            Нет изображения
          </div>
        )}
      </div>

      {/* Оверлей затемнения */}
      <div className="hero-overlay absolute inset-0 bg-black/40" />

      {/* Контент */}
      <div className="hero-content relative z-10 py-16 md:py-24">
        <div className="container">
          <div className="kicker text-sm font-semibold uppercase tracking-wider text-violet-200">
            {t(data.kicker, lang)}
          </div>

          <h1 className="hero-title hero-title--onimg mt-3 text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-md">
            {t(data.titleTop, lang)} <br /> {t(data.titleBottom, lang)}
          </h1>

          <p className="mt-5 text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl">
            {t(data.subtitle, lang)}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button className="btn btn-primary press">Выбрать тур</button>
          </div>
        </div>
      </div>
    </section>
  );
}