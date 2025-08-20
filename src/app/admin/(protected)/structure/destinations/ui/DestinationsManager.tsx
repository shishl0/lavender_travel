"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type L = { ru?: string; kk?: string; en?: string };
type Item = {
  id?: string;
  key: string;
  title: L;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
};

function clampActive(items: Item[]): Item[] {
  let activeCount = 0;
  return items.map((it) => {
    if (it.isActive && activeCount < 8) {
      activeCount += 1;
      return it;
    }
    if (it.isActive && activeCount >= 8) {
      return { ...it, isActive: false };
    }
    return it;
  });
}

export default function DestinationsManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(() => clampActive(initial));
  const [busy, setBusy] = useState<null | "save" | "delete" | "upload">(null);
  const [uploadIdx, setUploadIdx] = useState<number | null>(null);

  const [dragId, setDragId] = useState<string | undefined>(undefined);
  const canAdd = useMemo(() => items.length < 24, [items.length]);

  function handleChange(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function addItem() {
    if (!canAdd) return;
    const next: Item = {
      key: "",
      title: { ru: "", kk: "", en: "" },
      imageUrl: "",
      isActive: false,
      sortOrder: items.length,
    };
    setItems((p) => [...p, next]);
  }

  function removeAt(idx: number) {
    const it = items[idx];
    if (it.id) {
      void deleteOnServer(it.id);
    }
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }));
    setItems(clampActive(next));
  }

  async function deleteOnServer(id: string) {
    try {
      setBusy("delete");
      const res = await fetch("/api/destinations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "delete failed");
      router.refresh();
    } catch (e) {
      alert("Ошибка удаления");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  function onDragStart(id?: string) {
    setDragId(id);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  function onDrop(overIndex: number) {
    if (dragId === undefined) return;
    const fromIndex = items.findIndex((i) => i.id === dragId);
    if (fromIndex < 0) return;

    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(overIndex, 0, moved);
    const withOrders = reordered.map((it, i) => ({ ...it, sortOrder: i }));
    setItems(clampActive(withOrders));
    setDragId(undefined);
  }

  async function uploadImageFor(idx: number, file: File) {
    try {
      setBusy("upload");
      setUploadIdx(idx);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "upload failed");
      handleChange(idx, { imageUrl: json.url as string });
    } catch (e) {
      alert("Ошибка загрузки");
      console.error(e);
    } finally {
      setBusy(null);
      setUploadIdx(null);
    }
  }

  async function saveAll() {
    setBusy("save");
    try {
      const trimmed = clampActive(
        items.map((it, i) => ({ ...it, sortOrder: i }))
      );
      setItems(trimmed);

      const upsertRes = await fetch("/api/destinations/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: trimmed }),
      });
      const upsertJson = await upsertRes.json().catch(() => ({}));
      if (!upsertRes.ok) throw new Error(upsertJson?.error || "bulk-save failed");

      const orderedIds: string[] = (upsertJson?.ids as string[]) ?? [];
      const reorderRes = await fetch("/api/destinations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      });
      const rj = await reorderRes.json().catch(() => ({}));
      if (!reorderRes.ok) throw new Error(rj?.error || "reorder failed");

      router.refresh();
      alert("Сохранено");
    } catch (e) {
      alert("Ошибка сохранения");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <button
          className="btn-ghost press"
          onClick={addItem}
          disabled={!canAdd || busy !== null}
        >
          + Добавить карточку
        </button>
        <button
          className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded press"
          onClick={saveAll}
          disabled={busy !== null}
        >
          {busy === "save" ? "Сохранение…" : "Сохранить"}
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((it, idx) => {
          const activeCount = items.filter((x) => x.isActive).length;
          const disableToggleOn = !it.isActive && activeCount >= 8;

          return (
            <div
              key={it.id ?? `new-${idx}`}
              className="rounded-lg border p-3 bg-white border-gray-300"
              draggable
              onDragStart={() => onDragStart(it.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-500">#{idx + 1}</div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!it.isActive}
                      disabled={disableToggleOn}
                      onChange={(e) =>
                        handleChange(idx, { isActive: e.target.checked })
                      }
                    />
                    Активен {disableToggleOn ? "(макс. 8)" : ""}
                  </label>
                  <button
                    onClick={() => removeAt(idx)}
                    disabled={busy === "delete"}
                    className="h-9 w-9 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 press"
                    title="Удалить"
                    >
                    <b>x</b>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <div className="grid gap-1">
                  <label className="text-sm">Key (уникальный)</label>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={it.key}
                    onChange={(e) => handleChange(idx, { key: e.target.value })}
                    placeholder="turkey, vietnam, thailand…"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm">Image</label>
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded-lg px-3 py-2 flex-1"
                      value={it.imageUrl || ""}
                      onChange={(e) =>
                        handleChange(idx, { imageUrl: e.target.value })
                      }
                      placeholder="/uploads/… или URL"
                    />
                    <label className="btn-ghost press cursor-pointer whitespace-nowrap">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImageFor(idx, file);
                        }}
                      />
                      {busy === "upload" && uploadIdx === idx ? "Загрузка…" : "Загрузить"}
                    </label>
                  </div>
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt="preview"
                      className="mt-2 h-28 w-auto rounded-lg border object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-3">
                {(["ru", "kk", "en"] as (keyof L)[]).map((code) => (
                  <div key={code} className="grid gap-1">
                    <label className="text-sm">Title ({code.toUpperCase()})</label>
                    <input
                      className="border rounded-lg px-3 py-2"
                      value={it.title?.[code] || ""}
                      onChange={(e) =>
                        handleChange(idx, {
                          title: { ...it.title, [code]: e.target.value },
                        })
                      }
                      placeholder={`Название (${code})`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-sm text-gray-500">Пока нет карточек.</div>
        )}
      </div>
    </div>
  );
}