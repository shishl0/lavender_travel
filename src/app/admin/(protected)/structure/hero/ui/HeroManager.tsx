"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HeroPreview from "./HeroPreview";

type L = { ru: string; kk: string; en: string };
type HeroRec = {
  id: string;
  isActive: boolean;
  kicker: L; titleTop: L; titleBottom: L; subtitle: L;
  ctaPrimary: L; ctaSecondary: L;           // оставляем в типе для совместимости API/БД
  imageUrl: string | null;
  imageAlt: L;                               // оставляем в типе для совместимости API/БД
};

const emptyL = (): L => ({ ru: "", kk: "", en: "" });
const asL = (v: any): L => ({
  ru: typeof v?.ru === "string" ? v.ru : "",
  kk: typeof v?.kk === "string" ? v.kk : "",
  en: typeof v?.en === "string" ? v.en : "",
});

function normalize(rec: any): HeroRec {
  return {
    id: rec.id,
    isActive: !!rec.isActive,
    kicker: asL(rec.kicker),
    titleTop: asL(rec.titleTop),
    titleBottom: asL(rec.titleBottom),
    subtitle: asL(rec.subtitle),
    ctaPrimary: asL(rec.ctaPrimary),
    ctaSecondary: asL(rec.ctaSecondary),
    imageUrl: rec.imageUrl ?? null,
    imageAlt: asL(rec.imageAlt),
  };
}

export default function HeroManager({
  initialAll,
  activeId,
}: {
  initialAll: any[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [list, setList] = useState<HeroRec[]>(() => initialAll.map(normalize));
  const [selectedId, setSelectedId] = useState<string | null>(activeId ?? list[0]?.id ?? null);
  const selected = useMemo(() => list.find((x) => x.id === selectedId) ?? null, [list, selectedId]);

  const [form, setForm] = useState<HeroRec>(() =>
    selected ?? {
      id: "",
      isActive: false,
      kicker: emptyL(),
      titleTop: emptyL(),
      titleBottom: emptyL(),
      subtitle: emptyL(),
      ctaPrimary: emptyL(),
      ctaSecondary: emptyL(),
      imageUrl: null,
      imageAlt: emptyL(),
    }
  );

  const [lang, setLang] = useState<keyof L>("ru");
  const [busy, setBusy] = useState<null | "save" | "upload" | "activate" | "delete">(null);
  const [isPending, startTransition] = useTransition();

  function selectProfile(id: string) {
    setSelectedId(id);
    const rec = list.find((x) => x.id === id);
    if (rec) setForm(rec);
  }

  function newProfile() {
    setSelectedId(null);
    setForm({
      id: "",
      isActive: false,
      kicker: emptyL(),
      titleTop: emptyL(),
      titleBottom: emptyL(),
      subtitle: emptyL(),
      ctaPrimary: emptyL(),
      ctaSecondary: emptyL(),
      imageUrl: null,
      imageAlt: emptyL(),
    });
  }

  function setL(field: keyof HeroRec, l: keyof L, v: string) {
    setForm((p) => ({ ...p, [field]: { ...(p[field] as L), [l]: v } as any }));
  }

  async function uploadImage(file: File) {
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j?.url) throw new Error("upload failed");
      setForm((p) => ({ ...p, imageUrl: j.url as string }));
    } catch (e) {
      alert("Ошибка загрузки изображения");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    try {
      const res = await fetch("/api/hero/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || "save failed");

      const id = (j.id as string) ?? form.id;
      const fresh = { ...form, id };
      setList((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return [fresh, ...prev];
        const copy = [...prev];
        copy[idx] = fresh;
        return copy;
      });
      setSelectedId(id);
      startTransition(() => router.refresh());
    } catch (e) {
      alert("Ошибка сохранения");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function makeActive(id: string) {
    setBusy("activate");
    try {
      const res = await fetch("/api/hero/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || "activate failed");

      setList((prev) => prev.map((x) => ({ ...x, isActive: x.id === id })));
      startTransition(() => router.refresh());
    } catch (e) {
      alert("Ошибка активации");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить этот профиль Hero?")) return;
    setBusy("delete");
    try {
      const res = await fetch("/api/hero/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || "delete failed");

      setList((prev) => prev.filter((x) => x.id !== id));
      if (selectedId === id) {
        const next = list.find((x) => x.id !== id) || null;
        setSelectedId(next?.id ?? null);
        setForm(
          next ??
            ({
              id: "",
              isActive: false,
              kicker: emptyL(),
              titleTop: emptyL(),
              titleBottom: emptyL(),
              subtitle: emptyL(),
              ctaPrimary: emptyL(),
              ctaSecondary: emptyL(),
              imageUrl: null,
              imageAlt: emptyL(),
            } as HeroRec)
        );
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert("Ошибка удаления");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] md:text-[20px] font-extrabold text-[var(--navy)]">Hero</h2>
            <p className="text-slate-600 text-sm mt-0.5">Заголовки, подзаголовок и фон главного блока.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_380px] gap-6">
      {/* Левая колонка — форма (как в SiteSettings) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Hero</h2>
          <p className="text-xs text-slate-500">Заголовки, сабтайтл и изображение</p>
        </div>

        {/* Переключатель языков */}
        <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
          {(["ru", "kk", "en"] as (keyof L)[]).map((code) => (
            <button
              key={code}
              className={["px-3 h-9 rounded-lg text-sm", lang === code ? "bg-violet-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-200"].join(" ")}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Поля локализации — оставили только нужные */}
        <div className="grid gap-3">
          {(
            [
              ["kicker", "Kicker"] as const,
              ["titleTop", "Title (top)"] as const,
              ["titleBottom", "Title (bottom)"] as const,
              ["subtitle", "Subtitle"] as const,
            ] satisfies Array<[keyof HeroRec, string]>
          ).map(([field, label]) => (
            <div key={field} className="grid gap-1">
              <label className="text-sm">
                {label} ({lang.toUpperCase()})
              </label>
              <input
                className="h-[44px] w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-[15px] leading-[1.2] outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-200 transition"
                value={(form[field] as L)[lang]}
                onChange={(e) => setL(field, lang, e.target.value)}
                placeholder={label}
              />
            </div>
          ))}

          {/* Блок изображения — только загрузка файла, без текстового инпута URL */}
          <div className="grid gap-1">
            <label className="text-sm">Изображение</label>
            <div className="flex items-center gap-2">
              <label className="h-[60px] w-30 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] leading-[1.2] outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer press">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                  }}
                />
                {busy === "upload" ? "Загрузка…" : "Загрузить файл"}
              </label>
              {form.imageUrl && (
                <span className="text-xs text-slate-500 truncate">
                  {form.imageUrl.split("/").pop()}
                </span>
              )}
            </div>

            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="preview" className="mt-2 max-h-48 rounded-xl border shadow-sm" />
            ) : (
              <div className="mt-2 h-28 rounded-xl border grid place-items-center text-xs text-slate-400">
                Файл не выбран
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              className="btn btn-primary press"
              disabled={!!busy || isPending}
              onClick={save}
            >
              {busy === "save" ? "Сохранение…" : form.id ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>

        {/* По желанию можно оставить быстрый превью внизу формы */}
        <div className="mt-6 rounded-xl p-4 bg-slate-50">
          <div className="text-xs mb-2 text-slate-500">Превью</div>
          <HeroPreview data={form} lang={lang} />
        </div>
      </div>

      {/* Правая колонка — профили (как в SiteSettings) */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Профили</h3>

        <div className="space-y-2 pr-1">
          {list.map((h) => {
            const isActive = h.isActive;
            const isSelected = selectedId === h.id;
            return (
              <div
                key={h.id}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition",
                  isSelected ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                <button
                  className="min-w-0 flex-1 text-left outline-none"
                  onClick={() => selectProfile(h.id)}
                  title="Открыть в форме"
                >
                  <div className="truncate text-sm font-medium">
                    {h.titleTop?.ru || h.titleTop?.kk || h.titleTop?.en || "Без названия"}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {h.kicker?.ru || h.kicker?.kk || h.kicker?.en || "—"}
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">
                      <span>●</span> Активно
                    </span>
                  ) : (
                    <button
                      onClick={() => makeActive(h.id)}
                      disabled={busy === "activate" || isPending}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                      title="Сделать активным"
                    >
                      Активировать
                    </button>
                  )}

                  {!isActive && (
                    <button
                      onClick={() => remove(h.id)}
                      disabled={busy === "delete" || isPending}
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

        {/* Кнопка «Новый профиль» — СНИЗУ, как просил, с нужным стилем */}
        <div className="mt-4">
          <button
            className="w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 active:scale-[0.99]"
            onClick={newProfile}
          >
            + Новый профиль
          </button>
        </div>
      </aside>
      </div>
    </div>
  );
}
