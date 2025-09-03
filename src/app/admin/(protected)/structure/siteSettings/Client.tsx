"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SettingsForm from "./ui/SettingsForm";
import ActivateButton from "./ui/ActivateButton";

export type Localized = { ru?: string | null; kk?: string | null; en?: string | null };

export type Settings = {
  id: string;
  isActive: boolean;

  // Бренд/SEO/контакты
  brandName: string;
  brandTagline: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;

  // Статы/опыт
  statsClients?: number | null;
  statsRating?: number | null;
  inTourismSince?: string | null;   // ISO
  statsMode?: "shown" | "hidden" | "auto" | null;
  statsAutoAt?: string | null;      // ISO

  // Адрес/документы
  address?: Localized | null;
  certificateUrl?: string | null;

  // Политики
  privacyPolicy?: Localized | null;
  termsOfService?: Localized | null;

  // Минималка
  pricingMinPriceEnabled?: boolean;
  pricingMinPriceFormula?: string | null;

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

  const empty: Settings = useMemo(
    () => ({
      id: "",
      isActive: false,
      brandName: "",
      brandTagline: "",
      metaTitle: "",
      metaDescription: "",
      ogImageUrl: "",
      whatsappNumber: "",
      instagramUrl: "",
      updatedAt: new Date().toISOString(),

      statsClients: null,
      statsRating: null,
      inTourismSince: null,
      statsMode: "shown",
      statsAutoAt: null,

      address: { ru: "", kk: "", en: "" },
      certificateUrl: "",

      privacyPolicy: { ru: "", kk: "", en: "" },
      termsOfService: { ru: "", kk: "", en: "" },

      pricingMinPriceEnabled: false,
      pricingMinPriceFormula: "",
    }),
    []
  );

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
      {/* Левая колонка — Форма */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Site Settings</h2>
            <p className="text-xs text-gray-500">Бренд, SEO, контакты и глобальные флаги</p>
          </div>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => setSelected(empty)}
          >
            + Новый профиль
          </button>
        </div>
        <SettingsForm initial={selected} />
      </div>

      {/* Правая колонка — список профилей */}
      <aside className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Профили</h3>
        <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
          {list.map((s) => {
            const isActive = s.isActive;
            const isSelected = selected?.id === s.id;
            return (
              <div
                key={s.id}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition",
                  isSelected ? "border-violet-300 bg-violet-50" : "hover:bg-gray-50",
                ].join(" ")}
              >
                <button
                  className="min-w-0 flex-1 text-left outline-none"
                  onClick={() => setSelected(s)}
                  title="Открыть в форме"
                >
                  <div className="truncate text-sm font-medium">{s.brandName}</div>
                  <div className="truncate text-xs text-gray-500">{s.metaTitle}</div>
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
            <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">
              Пока нет профилей.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}