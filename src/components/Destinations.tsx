"use client";
import Image from "next/image";
import { DestinationDTO, Locale } from "@/types/cms";
import { useTranslation } from "react-i18next";

export default function Destinations({ cms }: { cms: DestinationDTO[] }) {
  const { t, i18n } = useTranslation();
  const L = (i18n.language?.slice(0, 2) as Locale) || "ru";

  return (
    <section id="dest" className="section bg-[var(--tint)]">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold" style={{ color: "var(--navy)" }}>
          {t("dest.title")}
        </h2>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {cms.map((d) => {
            const title = d.title?.[L] ?? d.key;
            return (
              <article key={d.id} className="card p-5 text-center">
                <div className="mx-auto w-28 h-28 rounded-full overflow-hidden shadow-sm ring-1 ring-gray-100">
                  <Image
                    src={d.imageUrl || `/images/destinations/${d.key}.jpg`}
                    alt={title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 font-semibold">{title}</div>
                <a href="#contact" className="mt-3 inline-block text-sm underline text-gray-600">
                  {t("dest.cta")}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}