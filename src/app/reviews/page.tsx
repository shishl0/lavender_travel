import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveSettings } from "@/lib/cms-cache";
import ReviewsPageClient from "./ReviewsPageClient";
import ReviewsHeader from "./ReviewsHeader";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const settings = await getActiveSettings().catch(() => null);

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <ReviewsHeader />

        {/* Весь интерактив/загрузка отзывов — на клиенте */}
        <ReviewsPageClient />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}
