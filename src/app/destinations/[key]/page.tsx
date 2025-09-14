import { notFound } from "next/navigation";
import { getDestinationByKey, getActiveSettings } from "@/lib/cms-cache";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsPage from "./DestinationsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  const [dto, settings] = await Promise.all([
    getDestinationByKey(key),
    getActiveSettings().catch(() => null),
  ]);

  if (!dto || !dto.isActive) return notFound();

  const waDigitsForForm =
    String(settings?.whatsappNumber || "")
      .replace(/\D/g, "")
      .replace(/^8/, "7") || "77080086191";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header settings={settings as any} />
      <DestinationsPage
        dto={dto as any}
        settings={settings as any}
        waDigitsForForm={waDigitsForForm}
      />
      <Footer settings={settings as any} />
    </div>
  );
}