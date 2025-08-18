"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HeroPreview from "./HeroPreview";

type L = { ru: string; kk: string; en: string };
type HeroRec = {
  id: string;
  isActive: boolean;
  kicker: L; titleTop: L; titleBottom: L; subtitle: L;
  ctaPrimary: L; ctaSecondary: L;
  imageUrl: string | null;
  imageAlt: L;
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
  const [pending, startTransition] = useTransition();

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
    <div className="grid md:grid-cols-[380px_1fr] gap-6">
      {/* левая колонка — список профилей */}
      <aside className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Профили</h3>
          <button className="btn-ghost press" onClick={newProfile} disabled={!!busy || pending}>
            + Новый
          </button>
        </div>

        <ul className="space-y-2">
          {list.map((h) => {
            const active = h.isActive;
            const current = h.id === selectedId;
            return (
              <li
                key={h.id}
                className={[
                  "rounded-lg border p-3 hover:bg-gray-50 transition",
                  current ? "ring-1 ring-[#5e3bb7] bg-[#f7f4ff]" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <button className="text-left min-w-0" onClick={() => selectProfile(h.id)}>
                    <div className="font-medium truncate">
                      {h.titleTop?.ru || h.titleTop?.kk || h.titleTop?.en || "Без названия"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">обновлён</div>
                  </button>
                  <div className="flex items-center gap-2">
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                        ✅ Активно
                      </span>
                    ) : (
                      <button
                        className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 press disabled:opacity-60"
                        disabled={!!busy || pending}
                        onClick={() => makeActive(h.id)}
                      >
                        Сделать активным
                      </button>
                    )}
                    <button
                      className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 press disabled:opacity-60"
                      disabled={!!busy || pending || active}
                      onClick={() => remove(h.id)}
                      title={active ? "Нельзя удалить активный" : "Удалить"}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* правая колонка — форма + превью */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Редактирование</h3>
            <div className="flex items-center gap-2">
              {(["ru", "kk", "en"] as (keyof L)[]).map((code) => (
                <button
                  key={code}
                  className={[
                    "px-2 py-1 rounded-md border text-xs press",
                    lang === code ? "bg-[#f0ecfb] text-[#5e3bb7] border-[#dcd0ff]" : "hover:bg-gray-50",
                  ].join(" ")}
                  onClick={() => setLang(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {(
              [
                ["kicker", "Kicker"] as const,
                ["titleTop", "Title (top)"] as const,
                ["titleBottom", "Title (bottom)"] as const,
                ["subtitle", "Subtitle"] as const,
                ["ctaPrimary", "CTA Primary"] as const,
                ["ctaSecondary", "CTA Secondary"] as const,
                ["imageAlt", "Image Alt"] as const,
              ] satisfies Array<[keyof HeroRec, string]>
            ).map(([field, label]) => (
              <div key={field} className="grid gap-1">
                <label className="text-sm">
                  {label} ({lang.toUpperCase()})
                </label>
                <input
                  className="border rounded-lg px-3 py-2"
                  value={(form[field] as L)[lang]}
                  onChange={(e) => setL(field, lang, e.target.value)}
                  placeholder={label}
                />
              </div>
            ))}

            <div className="grid gap-1">
              <label className="text-sm">Image URL</label>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={form.imageUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value || null }))}
                  placeholder="/uploads/hero.jpg"
                />
                <label className="btn-ghost press cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f);
                    }}
                  />
                  {busy === "upload" ? "Загрузка…" : "Загрузить"}
                </label>
              </div>
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="preview" className="mt-2 max-h-40 rounded-lg border" />
              ) : null}
            </div>

            <div className="pt-2">
              <button className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded press" disabled={!!busy || pending} onClick={save}>
                {busy === "save" ? "Сохранение…" : form.id ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Превью</h3>
          <HeroPreview data={form} lang={lang} />
        </div>
      </section>
    </div>
  );
}