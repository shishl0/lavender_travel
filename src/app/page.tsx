import { getActiveSettings, getActiveHero, getActiveDestinations } from '@/lib/cms-cache';
import { waNumberToE164 } from '@/lib/phone';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DestinationsTeaser from "@/components/DestinationsTeaser";
import Stats from "@/components/Stats";
import ReviewsTeaser from "@/components/reviews/ReviewsTeaser";
import AboutTeaser from "@/components/AboutTeaser";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import ReviewModal from "@/components/reviews/ReviewModal";

type ExperienceUnit = "months" | "years";
function calcExperienceParts(sinceISO?: string | null): { value: number | undefined; unit: ExperienceUnit | undefined } {
  if (!sinceISO) return { value: undefined, unit: undefined };

  const since = new Date(sinceISO);
  if (Number.isNaN(+since)) return { value: undefined, unit: undefined };

  const now = new Date();
  const months =
    (now.getFullYear() - since.getFullYear()) * 12 +
    (now.getMonth() - since.getMonth());

  if (months < 12) {
    return { value: Math.max(0, months), unit: "months" };
  }
  const years = Math.floor(months / 12);
  return { value: years, unit: "years" };
}

export default async function Page() {
  const [settings, hero, dests] = await Promise.all([getActiveSettings(), getActiveHero(), getActiveDestinations()]);
  const waDigits = waNumberToE164(settings?.whatsappNumber) ?? "77080086191";

  // ====== совместимость полей ======
  // 1) Глобальный флаг минималки: поддерживаем старое settings.pricing.minPriceEnabled и новое settings.pricingMinPriceEnabled
  const minPriceEnabled = false
    // Boolean((settings as any)?.pricing?.minPriceEnabled ?? (settings as any)?.pricingMinPriceEnabled);

  // 2) Режим статистики — без изменений
  const mode = (settings as any)?.statsMode ?? "shown";

  // 3) Время авто-включения статистики: поддерживаем statsAutoAtISO (стар.) и statsAutoAt (нов., Date/ISO)
  const autoAtRaw = (settings as any)?.statsAutoAtISO ?? (settings as any)?.statsAutoAt ?? null;
  const autoAt = autoAtRaw ? new Date(autoAtRaw) : null;
  const showStats = mode === "shown" || (mode === "auto" && autoAt && autoAt <= new Date());

  // 4) «В туризме с …»: поддерживаем inTourismSinceISO (стар.) и inTourismSince (нов., Date/ISO)
  const inTourismSinceRaw = (settings as any)?.inTourismSinceISO ?? (settings as any)?.inTourismSince ?? null;
  const { value: yearsOrMonths, unit } = calcExperienceParts(inTourismSinceRaw);

  // teaser top4 — по флагу showOnHome, с dev-ценами как раньше
  const DEV = process.env.NODE_ENV !== "production";
  const mockPrices = [289000, 349000, 219000, 399000, 259000, 305000];

  const top5Raw = (dests ?? [])
    .filter(d => d.showOnHome)
    .slice(0, 5)
    .map((d, i) => ({
      id: d.id,
      title: d.title,
      imageUrl: d.imageUrl ?? undefined,
      // цену показываем ТОЛЬКО если глобальный флаг включён И allowMinPrice у направления
      priceFrom: minPriceEnabled && d.allowMinPrice
        ? (d.priceFrom ?? (DEV ? mockPrices[i % mockPrices.length] : undefined))
        : undefined,
      href: `/destinations/${d.key}`,
    }));

  return (
    <>
      <SmoothScroll />
      <Header settings={settings ?? null} />
      <main>
        <Hero cms={hero ?? null} waDigits={waDigits} />
        {showStats && (
          <Stats
            overHero
            items={[
              {
                icon: "users",
                value: settings?.statsClients ?? undefined,
                unit: "clients",
              },
              {
                icon: "years",
                value: yearsOrMonths ?? undefined, // <-- undefined, не null
                unit: unit ?? "years",
              },
              {
                icon: "star",
                value: settings?.statsRating ?? undefined,
                unit: "rating",
              },
            ]}
          />
        )}

        <DestinationsTeaser items={top5Raw} />
        <ReviewsTeaser />
        <AboutTeaser instagram={settings?.instagramUrl || "https://www.instagram.com/lavender_travel_kz"}/>
      </main>
      <Footer settings={settings ?? null} />
      <ReviewModal />
    </>
  );
}
