import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveSettings } from "@/lib/cms-cache";
import { getServerT } from "@/lib/i18n-server";
import TermsContent from "./TermsContent";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await getActiveSettings().catch(() => null);
  const { t } = await getServerT();

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("about.docs.terms", "Условия обслуживания")}
          </h1>
        </header>

        <TermsContent settings={settings ?? null} />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}

