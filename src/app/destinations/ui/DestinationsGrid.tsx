"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Localized } from "@/types/cms";

type Item = {
  id: string;
  title: string | Localized;
  imageUrl?: string;
  href?: string;
};

export default function DestinationsGrid({ items = [] as Item[] }) {
  const { i18n } = useTranslation();
  if (!items?.length) return null;

  const lang = (i18n.language || "ru").slice(0, 2);

  const resolveTitle = (t: string | Localized): string => {
    if (typeof t === "string") return t;
    if (lang === "kk" && t.kk) return t.kk;
    if (lang === "en" && t.en) return t.en;
    if (lang === "ru" && t.ru) return t.ru;
    return t.ru || t.kk || t.en || "";
  };

  const list = items.map((it) => ({ ...it, _title: resolveTitle(it.title) }));

  return (
    <section className="teaser" aria-labelledby="allDestinationsTitle">
      <div className="pop-grid" data-count={list.length}>
        {list.map((d) => {
          const href = d.href || `/destinations#${d.id}`;
          const img = d.imageUrl || "/images/placeholder.jpg";
          const titleText = d._title || "";

          return (
            <Link
              key={d.id}
              href={href}
              className="pop-card press"
              aria-label={titleText}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pop-img"
                src={img}
                alt={titleText}
                loading="lazy"
                decoding="async"
              />

              <div className="pop-cap">
                <div className="pop-title">{titleText}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
