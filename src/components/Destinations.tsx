"use client";

import Image from "next/image";
import {useTranslation} from "react-i18next";

const items = [
  { key: "turkey",  img:"/images/destinations/turkey.png"   },
  { key: "vietnam", img:"/images/destinations/vietnam.jpg"  },
  { key: "thailand",img:"/images/destinations/thailand.jpg" },
  { key: "uae",     img:"/images/destinations/uae.jpg"      },
  { key: "egypt",   img:"/images/destinations/egypt.png"    },
] as const;

export default function Destinations(){
  const {t} = useTranslation();
  return (
    <section id="dest" className="section bg-[var(--tint)]">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold" style={{color:"var(--navy)"}}>
          {t("dest.title")}
        </h2>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map((d)=>(
            <article key={d.key} className="card p-5 text-center">
              <div className="mx-auto w-28 h-28 rounded-full overflow-hidden shadow-sm ring-1 ring-gray-100">
                <Image src={d.img} alt={t(`dest.items.${d.key}`)} width={300} height={300} className="w-full h-full object-cover"/>
              </div>
              <div className="mt-3 font-semibold">{t(`dest.items.${d.key}`)}</div>
              <a href="#contact" className="mt-3 inline-block text-sm underline text-gray-600">
                {t("dest.cta")}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}