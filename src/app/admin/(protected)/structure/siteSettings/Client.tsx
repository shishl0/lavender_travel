"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SettingsForm from "./ui/SettingsForm";
import ActivateButton from "./ui/ActivateButton";

type Settings = {
  id: string;
  isActive: boolean;
  brandName: string;
  brandTagline: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
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

      if (selected?.id === id) {
        setSelected(active ?? null);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert((e as Error).message || "Ошибка удаления");
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-6">
      {/* Левая колонка — Форма */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Site Settings</h2>
          <button
            className="btn-ghost press text-sm"
            onClick={() => setSelected(empty)}
          >
            + Новый профиль
          </button>
        </div>
        <SettingsForm initial={selected} />
      </div>

      {/* Правая колонка — список профилей */}
      <div className="card p-5">
        <h3 className="text-base font-semibold mb-3">Профили</h3>
        <ul className="space-y-3">
          {list.map((s) => {
            const isActive = s.isActive;
            const isSelected = selected?.id === s.id;
            return (
              <li
                key={s.id}
                className={[
                  "rounded-lg border px-3 py-2 flex items-center justify-between gap-3",
                  isSelected ? "border-[#d7cff6] bg-[#f7f5ff]" : "",
                ].join(" ")}
              >
                <button
                  className="min-w-0 text-left flex-1"
                  onClick={() => setSelected(s)}
                  title="Открыть в форме"
                >
                  <div className="font-medium truncate">{s.brandName}</div>
                  <div className="text-xs text-gray-500 truncate">{s.metaTitle}</div>
                </button>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                      ✅ Активно
                    </span>
                  ) : (
                    <ActivateButton id={s.id} />
                  )}

                  {!isActive && (
                    <button
                      className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 press disabled:opacity-60"
                      onClick={() => remove(s.id)}
                      disabled={busyId === s.id || isPending}
                      title="Удалить профиль"
                    >
                      {busyId === s.id ? "Удаляем…" : "Удалить"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {list.length === 0 && (
          <div className="text-sm text-gray-500">Пока нет профилей.</div>
        )}
      </div>
    </div>
  );
}