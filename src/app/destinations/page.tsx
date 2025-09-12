import { getActiveSettings, getActiveDestinations } from "@/lib/cms-cache";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsHeader from "./ui/DestinationsHeader";
import DestinationsGrid from "./ui/DestinationsGrid";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const [settings, dests] = await Promise.all([
    getActiveSettings().catch(() => null),
    getActiveDestinations().catch(() => []),
  ]);

  // Берём все активные направления и передаём локализуемые заголовки в клиентский грид
  const items = (dests ?? [])
    .filter((d) => d?.isActive !== false)
    .map((d) => ({
      id: d.id,
      title: d.title, // Localized — выбираем на клиенте по текущему языку
      imageUrl: d.imageUrl ?? undefined,
      href: `/destinations/${d.key}`,
    }));

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="section container py-10 md:py-14">
        <DestinationsHeader />

        <DestinationsGrid items={items} />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}
