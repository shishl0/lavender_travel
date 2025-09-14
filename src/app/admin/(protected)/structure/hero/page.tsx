import { prisma } from "@/lib/prisma";
import HeroManager from "./ui/HeroManager";

export const revalidate = 0;

export default async function HeroPage() {
  const all = await prisma.hero.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const active = all.find((h) => h.isActive) || null;

  return (
    <div className="grid gap-6">
      <HeroManager initialAll={all} activeId={active?.id ?? null} />
    </div>
  );
}
