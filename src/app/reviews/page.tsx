import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveSettings } from "@/lib/cms-cache";
import ReviewsPageClient from "./ReviewsPageClient";

export const dynamic = "force-dynamic";

// локальный переводчик с фолбэком
const t = (key: string, fb: string) => fb;

export default async function ReviewsPage() {
  const settings = await getActiveSettings().catch(() => null);

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("reviews.title", "Отзывы")}
          </h1>
          <p className="mt-1 text-slate-600">
            {t(
              "reviews.subtitle",
              "Спасибо, что делитесь впечатлениями — это помогает другим путешественникам."
            )}
          </p>
        </header>

        {/* Весь интерактив/загрузка отзывов — на клиенте */}
        <ReviewsPageClient />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}