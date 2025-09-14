import { getActiveSettings } from "@/lib/cms-cache";
import AboutClient from "./AboutClient";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getActiveSettings();
  return <AboutClient settings={settings} />;
}