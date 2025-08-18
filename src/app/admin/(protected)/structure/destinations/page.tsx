import { prisma } from "@/lib/prisma";
import DestinationsManager from "./ui/DestinationsManager";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const rows = await prisma.destination.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const initial = rows.map((r) => ({
    id: r.id,
    key: r.key,
    title: (r.title ?? { ru: "", kk: "", en: "" }) as {
      ru?: string; kk?: string; en?: string;
    },
    imageUrl: r.imageUrl ?? "",
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  }));

  return (
    <div className="grid gap-6">
      <div className="card p-5">
        <DestinationsManager initial={initial} />
      </div>
    </div>
  );
}