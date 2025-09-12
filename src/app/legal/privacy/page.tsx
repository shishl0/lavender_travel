import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveSettings } from "@/lib/cms-cache";
import { getServerT } from "@/lib/i18n-server";
import PolicyContent from "./PolicyContent";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getActiveSettings().catch(() => null);
  const { t } = await getServerT();

  return (
    <>
      <Header settings={settings ?? null} />

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-14">

        <PolicyContent settings={settings ?? null} />
      </main>

      <Footer settings={settings ?? null} />
    </>
  );
}

