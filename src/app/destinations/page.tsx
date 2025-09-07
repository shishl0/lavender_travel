import { getActiveSettings, getActiveDestinations } from "@/lib/cms-cache";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Встроенный тизер без "use client" (хуков нет — можно рендерить на сервере)
type TeaserItem = {
  id: string;
  title: string;
  imageUrl?: string;
  href?: string;
};

// локальный переводчик с фолбэком
const t = (key: string, fb: string) => fb;

function Destinations({ items = [] as TeaserItem[] }) {
  if (!items?.length) return null;

  return (
    <section className="teaser" aria-labelledby="popularDestinationsTitle">
      <div className="pop-grid">
        {items.map((d) => {
          const href = d.href || `/destinations#${d.id}`;
          const img = d.imageUrl || "/images/placeholder.jpg";

          return (
            <Link
              key={d.id}
              href={href}
              className="pop-card press"
              aria-label={d.title}
            >
              {/* фон */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pop-img"
                src={img}
                alt={d.title}
                loading="lazy"
                decoding="async"
              />

              {/* подпись на блюре (сам блюр задаёт .pop-card::after) */}
              <div className="pop-cap">
                <div className="pop-title">{d.title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function DestinationsPage() {
  const [settings, dests] = await Promise.all([
    getActiveSettings().catch(() => null),
    getActiveDestinations().catch(() => []),
  ]);

  // Берём все активные направления, сортируем по названию, формируем элементы для тизера
  const items: TeaserItem[] = (dests ?? [])
    .filter((d) => d?.isActive !== false)
    .map((d) => ({
      id: d.id,
      title: d.title?.ru || d.title?.kk || d.title?.en || d.key || t("destinations.fallbackTitle", "Направление"),
      imageUrl: d.imageUrl ?? undefined,
      href: `/destinations/${d.key}`,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="section container py-10 md:py-14">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("destinations.title", "Направления")}
          </h1>
        </header>

        <Destinations items={items} />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}