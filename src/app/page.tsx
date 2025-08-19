import { getActiveSettings, getActiveHero, getActiveDestinations } from '@/lib/cms-cache';
import { waNumberToE164 } from '@/lib/phone';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import WhyUs from "@/components/WhyUs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import SmoothScroll from "@/components/SmoothScroll";
import ReviewPublicForm from '@/components/reviews/ReviewPublicForm';

export default async function Page() {
  // всё — из кеша (unstable_cache)
  const [settings, hero, dests] = await Promise.all([
    getActiveSettings(),
    getActiveHero(),
    getActiveDestinations(),
  ]);

  const waDigits = waNumberToE164(settings?.whatsappNumber) ?? "77080086191";

  return (
    <>
      <SmoothScroll />
      <Header settings={settings ?? null} />
      <main>
        <Hero cms={hero ?? null} waDigits={waDigits} />
        <Destinations cms={dests ?? []} />
        <WhyUs />
        <Contact settings={settings ?? null} />
        <ReviewPublicForm />
      </main>
      <Footer settings={settings ?? null} />
      <WhatsAppFab phone={waDigits} />
    </>
  );
}