import { prisma } from "@/lib/prisma";
import SiteSettingsClient from "./Client";

export default async function SiteSettingsPage() {
  const [active, all] = await Promise.all([
    prisma.siteSettings.findFirst({ where: { isActive: true } }),
    prisma.siteSettings.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  const toPlain = (s: any) =>
    s && {
      ...s,
      updatedAt: s.updatedAt?.toISOString?.() ?? s.updatedAt,
    };

  return <SiteSettingsClient active={toPlain(active)} list={all.map(toPlain)} />;
}