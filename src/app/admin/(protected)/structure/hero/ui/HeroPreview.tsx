"use client";

type L = { ru: string; kk: string; en: string };
type Data = {
  kicker: L; titleTop: L; titleBottom: L; subtitle: L;
  ctaPrimary: L; ctaSecondary: L;
  imageUrl: string | null; imageAlt: L;
};

export default function HeroPreview({ data, lang }: { data: Data; lang: keyof L }) {
  const t = (l: L) => l?.[lang] || l?.ru || l?.en || l?.kk || "";

  return (
    <div className="rounded-xl border p-5 bg-gradient-to-br from-white to-[#faf7ff]">
      <div className="text-sm text-[#5e3bb7] font-semibold">{t(data.kicker)}</div>
      <div className="mt-1 text-2xl font-bold">{t(data.titleTop)}</div>
      <div className="text-2xl font-bold" style={{ color: "#5e3bb7" }}>{t(data.titleBottom)}</div>
      <div className="mt-2 text-gray-600">{t(data.subtitle)}</div>

      <div className="mt-4 flex items-center gap-2">
        <button className="btn-primary press">{t(data.ctaPrimary) || "CTA Primary"}</button>
        <button className="btn-ghost press">{t(data.ctaSecondary) || "CTA Secondary"}</button>
      </div>

      {data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt={t(data.imageAlt) || "image"}
          className="mt-4 rounded-lg border max-h-64 object-cover w-full"
        />
      ) : (
        <div className="mt-4 h-40 rounded-lg border grid place-items-center text-sm text-gray-400">
          Нет изображения
        </div>
      )}
    </div>
  );
}