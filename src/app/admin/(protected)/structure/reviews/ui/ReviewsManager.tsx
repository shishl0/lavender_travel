"use client";

import { useEffect, useMemo, useState, useTransition, useId } from "react";
import ImagesUploader from "./ImagesUploader";

/* ========= Types ========= */
type ReviewRow = {
  id: string;
  name: string;
  text: string;
  images: string[];
  rating: number | string | null | undefined; // сервер может прислать как угодно
  isActive: boolean;
  createdAtISO: string;
  updatedAtISO: string;
  createdAtDisplay: string;
  updatedAtDisplay: string;
};

/* ========= helpers ========= */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function toRating(v: unknown, fallback = 5): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.round(n), 1, 5);
}
function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dPart = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const tPart = new Intl.DateTimeFormat("ru-RU", { hour12: false, hour: "2-digit", minute: "2-digit" }).format(d);
  return `${dPart}, ${tPart}`;
}
function enrichRow(r: any): ReviewRow {
  const createdISO =
    typeof r?.createdAtISO === "string"
      ? r.createdAtISO
      : r?.createdAt
      ? new Date(r.createdAt).toISOString()
      : "";
  const updatedISO =
    typeof r?.updatedAtISO === "string"
      ? r.updatedAtISO
      : r?.updatedAt
      ? new Date(r.updatedAt).toISOString()
      : "";

  return {
    id: String(r?.id ?? ""),
    name: String(r?.name ?? ""),
    text: String(r?.text ?? ""),
    images: Array.isArray(r?.images) ? r.images : [],
    rating: toRating(r?.rating),
    isActive: Boolean(r?.isActive),
    createdAtISO: createdISO,
    updatedAtISO: updatedISO,
    createdAtDisplay: createdISO ? fmtDateTime(createdISO) : "—",
    updatedAtDisplay: updatedISO ? fmtDateTime(updatedISO) : "—",
  };
}

/* ========= Stars ========= */
function Stars({
  value = 0,
  size = 16,
  className = "",
}: {
  value?: number;
  size?: number;
  className?: string;
}) {
  const uid = useId();
  const v = clamp(Number(value) || 0, 0, 5);

  const starPath =
    "M12 17.27l6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z";

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fillPart = clamp(v - i, 0, 1);
        const clipId = `${uid}-clip-${i}`;
        const fillWidth = 24 * fillPart;

        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={fillWidth} height="24" />
              </clipPath>
            </defs>

            <path d={starPath} fill="none" stroke="#D1D5DB" strokeWidth="1.3" />

            {fillPart > 0 && (
              <path
                d={starPath}
                clipPath={`url(#${clipId})`}
                fill="#f5b301"
                stroke="#f5b301"
                strokeWidth="1.3"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

function StarPicker({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const set = (n: number) => !disabled && onChange(clamp(n, 1, 5));
  return (
    <div className="mt-1 inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => set(n)}
            aria-label={`${n} из 5`}
            disabled={disabled}
            className={`w-8 h-8 grid place-items-center rounded-md press ${disabled ? "opacity-60" : "hover:bg-gray-50"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 17.27l6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
                fill={active ? "#f5b301" : "none"}
                stroke={active ? "#f5b301" : "#D1D5DB"}
                strokeWidth="1.3"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

/* ========= Component ========= */
export default function ReviewsManager({
  initial, canEdit, canDelete,
}: { initial: ReviewRow[]; canEdit: boolean; canDelete: boolean }) {
  // Нормализуем initial сразу (чтобы даты были даже без refetch)
  const normalizedInitial = useMemo(() => initial.map(enrichRow), [initial]);

  const [rows, setRows] = useState<ReviewRow[]>(normalizedInitial);
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Актуализируем из API (без кеша) и тоже нормализуем
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/list", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        const list = Array.isArray(j?.reviews) ? j.reviews : [];
        if (!stop) setRows(list.map(enrichRow));
      } catch {}
    })();
    return () => { stop = true; };
  }, []);

  const empty: ReviewRow = {
    id: "", name: "", text: "", images: [], rating: 5, isActive: false,
    createdAtISO: "", updatedAtISO: "", createdAtDisplay: "", updatedAtDisplay: "",
  };

  const avg = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + toRating(r.rating, 0), 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }, [rows]);
  const activeCount = useMemo(() => rows.filter((r) => r.isActive).length, [rows]);

  async function save(row: ReviewRow) {
    if (!canEdit) return;
    if (!row.name.trim() || !row.text.trim()) { alert("Имя и текст обязательны"); return; }
    const rating = toRating(row.rating);

    setBusy("save");
    try {
      const res = await fetch("/api/reviews/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id || undefined,
          name: row.name.trim(),
          text: row.text.trim(),
          images: Array.isArray(row.images) ? row.images.slice(0, 5) : [],
          isActive: row.isActive,
          rating,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "save failed");

      const saved = enrichRow(j.review ?? {});
      setRows((p) => {
        const idx = p.findIndex((x) => x.id === saved.id);
        if (idx === -1) return [saved, ...p];
        const copy = p.slice(); copy[idx] = saved; return copy;
      });
      setSelected(null);
      startTransition(() => location.reload());
    } catch (e) {
      alert((e as Error).message || "Ошибка сохранения");
      console.error(e);
    } finally { setBusy(null); }
  }

  async function toggleActive(id: string, isActive: boolean) {
    if (!canEdit) return;
    setBusy(`act:${id}`);
    try {
      const res = await fetch("/api/reviews/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "activate failed");

      // если сервер вернул целый объект отзыва — обновим дату/всё; иначе — только статус
      const maybe = j.review ? enrichRow(j.review) : null;
      setRows((p) =>
        p.map((x) =>
          x.id === id
            ? maybe
              ? { ...x, ...maybe } // тут подтянется updatedAtDisplay
              : { ...x, isActive }
            : x,
        ),
      );
    } catch (e) {
      alert((e as Error).message || "Ошибка переключения");
      console.error(e);
    } finally { setBusy(null); }
  }

  async function remove(id: string) {
    if (!canDelete) return;
    if (!confirm("Удалить отзыв?")) return;
    setBusy(`del:${id}`);
    try {
      const res = await fetch("/api/reviews/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "delete failed");
      setRows((p) => p.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert((e as Error).message || "Ошибка удаления");
      console.error(e);
    } finally { setBusy(null); }
  }

  function rowKeyOpen(e: React.KeyboardEvent, r: ReviewRow) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r); }
  }

  return (
    <div className="grid md:grid-cols-[1fr_480px] gap-6">
      {/* Список */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Отзывы</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-800">
                Средняя оценка: <span className="tabular-nums">{avg.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500">Активных: {activeCount} / Всего: {rows.length}</div>
            </div>
            <Stars value={avg || 0} size={18} />
          </div>
          <button className="btn-ghost press text-sm" onClick={() => setSelected({ ...empty })}>
            + Новый
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 w-[26%]">Имя</th>
                <th className="px-3 py-2 w-[16%]">Оценка</th>
                <th className="px-3 py-2 w-[14%]">Статус</th>
                <th className="px-3 py-2 w-[22%]">Обновлён</th>
                <th className="px-3 py-2 w-[22%] text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isBusy = busy?.startsWith(`act:${r.id}`) || busy?.startsWith(`del:${r.id}`);
                const rating = toRating(r.rating);
                return (
                  <tr
                    key={r.id}
                    className="border-t hover:bg-gray-50 cursor-pointer align-middle"
                    onClick={() => setSelected({ ...r, rating })}
                    onKeyDown={(e) => rowKeyOpen(e, { ...r, rating })}
                    tabIndex={0}
                    aria-label={`Открыть отзыв ${r.name}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium truncate" title={r.name}>{r.name}</div>
                    </td>
                    <td className="px-3 py-2"><Stars value={rating} /></td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {r.isActive ? "Активен" : "Скрыт"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {r.updatedAtDisplay || fmtDateTime(r.updatedAtISO)}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end items-center gap-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleActive(r.id, !r.isActive)}
                          disabled={!!isBusy}
                          title={r.isActive ? "Выключить" : "Включить"}
                          className="h-9 px-3 rounded-lg border border-purple-300 text-[13px]
                                     text-[var(--navy)] hover:bg-purple-50 press disabled:opacity-50"
                        >
                          {r.isActive ? "Выключить" : "Включить"}
                        </button>
                        <button
                          onClick={() => remove(r.id)}
                          className="h-9 w-9 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 press"
                          title="Удалить"
                        >
                          <b>x</b>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    Пока нет отзывов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Форма / превью */}
      <div className="card p-4">
        <h3 className="text-base font-semibold mb-3">{selected?.id ? "Редактировать" : "Новый отзыв"}</h3>
        {selected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500">Имя</label>
                <input
                  className="h-10 w-full border rounded-lg px-3 py-2"
                  value={selected.name}
                  onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Оценка</label>
                <StarPicker
                  value={toRating(selected.rating)}
                  onChange={(v) => setSelected({ ...selected, rating: v })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Текст</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 h-32"
                value={selected.text}
                onChange={(e) => setSelected({ ...selected, text: e.target.value })}
              />
            </div>

            <div>
              <ImagesUploader
                images={Array.isArray(selected.images) ? selected.images : []}
                onChange={(urls) => setSelected({ ...selected, images: urls })}
                max={5}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded press text-sm"
                onClick={() => save({ ...selected, rating: toRating(selected.rating) })}
                disabled={busy === "save"}
              >
                {busy === "save" ? "Сохраняем…" : "Сохранить"}
              </button>
              <button className="btn-ghost press text-sm ml-auto" onClick={() => setSelected(null)}>
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Выберите отзыв слева или создайте новый.</div>
        )}
      </div>
    </div>
  );
}