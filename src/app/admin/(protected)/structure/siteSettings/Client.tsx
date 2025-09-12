"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SettingsForm from "./ui/SettingsForm";
import ActivateButton from "./ui/ActivateButton";

export type Locale = "ru" | "kk" | "en";
export type Localized = { ru?: string | null; kk?: string | null; en?: string | null };

export type Settings = {
  id: string;
  isActive: boolean;

  // Бренд/SEO
  brandName: string;
  brandTagline: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;

  // Контакты
  phoneNumber: string | null;      // <-- новое
  whatsappNumber: string | null;
  instagramUrl: string | null;

  // Статы
  statsClients?: number | null;
  statsRating?: number | null;
  inTourismSince?: string | null;
  statsMode?: "shown" | "hidden" | null;

  // Адрес/доки
  address?: Localized | null;
  certificateUrl?: string | null;
  mapEmbedUrl?: string | null;     // <-- новое

  // Политики
  privacyPolicy?: Localized | null;
  termsOfService?: Localized | null;
  privacyPolicyDocUrls?: Partial<Record<Locale, string>> | null;   // <-- новое
  termsOfServiceDocUrls?: Partial<Record<Locale, string>> | null;  // <-- новое

  updatedAt: string;
};

export default function SiteSettingsClient({
  active,
  list,
}: {
  active: Settings | null;
  list: Settings[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Settings | null>(active ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // normalize -> initial для формы
  const toInitial = (s: Settings | null) =>
    s
      ? {
          id: s.id,
          brandName: s.brandName,
          brandTagline: s.brandTagline ?? "",
          metaTitle: s.metaTitle,
          metaDescription: s.metaDescription,
          ogImageUrl: s.ogImageUrl ?? "",

          phoneNumber: s.phoneNumber ?? "",           // новое
          whatsappNumber: s.whatsappNumber ?? "",
          instagramUrl: s.instagramUrl ?? "",

          statsMode: (s.statsMode === "shown" ? "shown" : "hidden") as "hidden" | "shown",
          statsClients: s.statsClients ?? null,
          statsRating: s.statsRating ?? null,
          inTourismSinceISO: s.inTourismSince ?? null,

          address: (s.address as any) ?? { ru: "", kk: "", en: "" },
          certificateUrl: s.certificateUrl ?? "",
          mapEmbedUrl: s.mapEmbedUrl ?? "",           // новое

          privacyPolicyDocUrls: s.privacyPolicyDocUrls ?? null,     // новое
          termsOfServiceDocUrls: s.termsOfServiceDocUrls ?? null,   // новое
        }
      : null;

  async function remove(id: string) {
    if (!confirm("Удалить этот профиль?")) return;
    try {
      setBusyId(id);
      const res = await fetch("/api/settings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "delete failed");

      if (selected?.id === id) setSelected(active ?? null);
      startTransition(() => router.refresh());
    } catch (e) {
      alert((e as Error).message || "Ошибка удаления");
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_380px] gap-6">
      {/* Левая колонка — форма */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SettingsForm initial={toInitial(selected)} />
      </div>

      {/* Правая колонка — профили */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Профили</h3>
        <div className="space-y-2 pr-1">
          {list.map((s) => {
            const isActive = s.isActive;
            const isSelected = selected?.id === s.id;
            return (
              <div
                key={s.id}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition",
                  isSelected ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                <button
                  className="min-w-0 flex-1 text-left outline-none"
                  onClick={() => setSelected(s)}
                  title="Открыть в форме"
                >
                  <div className="truncate text-sm font-medium">{s.brandName}</div>
                  <div className="truncate text-xs text-slate-500">{s.metaTitle}</div>
                </button>

                <div className="flex items-center gap-1">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">
                      <span>●</span> Активно
                    </span>
                  ) : (
                    <ActivateButton id={s.id} />
                  )}

                  {!isActive && (
                    <button
                      onClick={() => remove(s.id)}
                      disabled={busyId === s.id || isPending}
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                      title="Удалить профиль"
                    >
                      <span className="text-base leading-none">×</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Пока нет профилей.
            </div>
          )}
        </div>

        {/* Кнопка "Новый профиль" */}
        <div className="mt-4">
          <button
            className="w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 active:scale-[0.99]"
            onClick={() => setSelected(null)}
          >
            + Новый профиль
          </button>
        </div>
      </aside>
    </div>
  );
}