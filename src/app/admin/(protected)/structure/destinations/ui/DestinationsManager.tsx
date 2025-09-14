"use client";

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  memo,
} from "react";
import { useRouter } from "next/navigation";

import TimezonePicker from "./TimezonePicker";
import ClimateEditor from "./ClimateEditor";
import CurrencyEditor from "./CurrencyEditor";
import HeroImagesUploader from "./HeroImagesUploader";
import DestinationImageUploader from "./DestinationImageUploader";

/* ---------- types ---------- */
type L = { ru?: string; kk?: string; en?: string };
type LL = { ru?: string[]; kk?: string[]; en?: string[] };

export type ListItem = {
  id: string;
  key: string;
  title: L;
  imageUrl?: string | null;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder: number;

  cities?: LL | null;
  descriptionHtml?: L | null;

  heroImages?: string[] | null;
  basics?: {
    timezones?: string[] | null;
    capital?: L | null;
    languages?: LL | null;
    currencyCode?: string | null;
    currencyPerKZT?: number | null;
  } | null;

  faqVisa?: L | null;
  faqEntry?: L | LL | null;
  faqReturn?: L | LL | null;

  poi?: Array<{ title: L; imageUrl?: string | null; blurb?: L | null }> | null;
};

type FormInitial = {
  id?: string;
  key: string;
  title: L;
  imageUrl?: string | null;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder?: number;

  heroImages?: string[] | null;

  basics?: {
    timezones?: string[] | null;
    capital?: L | null;
    languages?: LL | null;
    currencyCode?: string | null;
    currencyPerKZT?: number | null;
  } | null;

  descriptionHtml?: L | null;
  cities?: LL | null;

  faqVisa?: L | null;
  faqEntry?: LL | null;
  faqReturn?: LL | null;

  poi?: Array<{ title: L; imageUrl?: string | null; blurb?: L | null }> | null;
};

/* ---------- UI helpers ---------- */
const inputBase =
  "h-[40px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] leading-[1.2] outline-none focus:ring-2 focus:ring-violet-200";
const section =
  "rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm";
const sectionHdr =
  "w-full flex items-center justify-between text-[14.5px] font-semibold";
const small = "text-xs text-slate-500";
const label = "text-sm text-slate-700";

const flag = (key: string) => {
  const m: Record<string, string> = {
    turkey: "🇹🇷",
    thailand: "🇹🇭",
    uae: "🇦🇪",
    egypt: "🇪🇬",
    vietnam: "🇻🇳",
    georgia: "🇬🇪",
  };
  return m[key.toLowerCase()] ?? "🌍";
};
const t = (v?: L) => v?.ru || v?.kk || v?.en || "";
const splitLines = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);
const joinLines = (arr?: string[] | null) =>
  arr?.length ? arr.join("\n") : "";

function normalizeLL(v: any): LL | null {
  if (!v || typeof v !== "object") return null;
  const coerce = (x: any) =>
    Array.isArray(x)
      ? x.map(String).filter(Boolean)
      : typeof x === "string"
      ? splitLines(x)
      : [];
  return { ru: coerce(v.ru), kk: coerce(v.kk), en: coerce(v.en) };
}

/* ============================================================ */
export default function DestinationsManager({ list }: { list: ListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ListItem[]>(list);
  const [selected, setSelected] = useState<FormInitial | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "saveOne" | "delete">(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [openClimate, setOpenClimate] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);
  const [openPoi, setOpenPoi] = useState(true);
  const [openFaq, setOpenFaq] = useState(true);
  const [openBasics, setOpenBasics] = useState(true);
  const [openAbout, setOpenAbout] = useState(true);

  // quick filters/search
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState<"all" | "active" | "home">("all");

  const empty: FormInitial = useMemo(
    () => ({
      key: "",
      title: { ru: "", kk: "", en: "" },
      imageUrl: "",
      isActive: false,
      showOnHome: false,
      heroImages: [],
      basics: {
        timezones: [],
        capital: { ru: "", kk: "", en: "" },
        languages: { ru: [], kk: [], en: [] },
        currencyCode: null,
        currencyPerKZT: null,
      },
      descriptionHtml: { ru: "", kk: "", en: "" },
      cities: { ru: [], kk: [], en: [] },
      faqVisa: { ru: "", kk: "", en: "" },
      faqEntry: { ru: [], kk: [], en: [] },
      faqReturn: { ru: [], kk: [], en: [] },
      poi: [],
    }),
    []
  );

  // Keep local items in sync with fresh server data after router.refresh()
  useEffect(() => {
    setItems(list);
    // If some destination is open — refresh it from new list (by id)
    if (selected?.id) {
      const it = list.find((x) => x.id === selected.id);
      if (it) {
        setSelected({
          id: it.id,
          key: it.key,
          title: it.title ?? { ru: "", kk: "", en: "" },
          imageUrl: it.imageUrl ?? "",
          isActive: it.isActive,
          showOnHome: it.showOnHome,
          sortOrder: it.sortOrder,
          heroImages: it.heroImages ?? [],
          basics:
            it.basics ?? {
              timezones: [],
              capital: { ru: "", kk: "", en: "" },
              languages: { ru: [], kk: [], en: [] },
              currencyCode: null,
              currencyPerKZT: null,
            },
          descriptionHtml:
            it.descriptionHtml ?? { ru: "", kk: "", en: "" },
          cities: it.cities ?? { ru: [], kk: [], en: [] },
          faqVisa: it.faqVisa ?? { ru: "", kk: "", en: "" },
          faqEntry: normalizeLL(it.faqEntry) ?? { ru: [], kk: [], en: [] },
          faqReturn: normalizeLL(it.faqReturn) ?? { ru: [], kk: [], en: [] },
          poi: (it.poi as any) ?? [],
        });
      }
    }
  }, [list]);

  const onChildSaved = () => startTransition(() => router.refresh());
  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const onDrop = async (overId: string) => {
    if (!dragId) return;
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;

    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    const withOrders = next.map((it, i) => ({ ...it, sortOrder: i }));
    setItems(withOrders);
    setDragId(null);

    try {
      await fetch("/api/destinations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: withOrders.map((x) => x.id) }),
      });
      startTransition(() => router.refresh());
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить направление?")) return;
    setBusy("delete");
    try {
      const res = await fetch("/api/destinations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "delete failed");
      setItems((p) =>
        p
          .filter((x) => x.id !== id)
          .map((x, i) => ({ ...x, sortOrder: i }))
      );
      if (selected?.id === id) setSelected(null);
      startTransition(() => router.refresh());
    } catch (e) {
      alert("Ошибка удаления");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const saveOne = async (payload: FormInitial) => {
    setBusy("saveOne");
    try {
      const body: any = {
        id: payload.id,
        key: payload.key.trim(),
        title: payload.title,
        imageUrl: payload.imageUrl?.toString().trim() || null,
        isActive: !!payload.isActive,
        showOnHome: !!payload.showOnHome,
        sortOrder: payload.sortOrder,
        heroImages: payload.heroImages ?? [],
        basics: payload.basics ?? null,
        descriptionHtml: payload.descriptionHtml ?? null,
        cities: payload.cities ?? null,
        faqVisa: payload.faqVisa ?? null,
        faqEntry: payload.faqEntry ?? null,
        faqReturn: payload.faqReturn ?? null,
        poi: payload.poi ?? [],
      };

      const res = await fetch("/api/destinations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok || !j?.id) throw new Error(j?.error || "save failed");

      // Always refresh from server to ensure all fields are up-to-date
      startTransition(() => router.refresh());

      alert("Сохранено");
    } catch (e) {
      alert("Ошибка сохранения");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_380px] gap-6">
      {/* LEFT */}
      <div className={section}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Страна — контент</h2>
          <p className={small}>Редактируй только то, что видит клиент на странице страны.</p>
        </div>

        {!selected ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-slate-500">
            Выбери страну справа или создай новую.
          </div>
        ) : (
          <MemoDestinationForm
            initial={selected}
            onCancel={() => setSelected(null)}
            onSave={saveOne}
            busy={busy === "saveOne"}
            openClimate={openClimate}
            setOpenClimate={setOpenClimate}
            openCurrency={openCurrency}
            setOpenCurrency={setOpenCurrency}
            openPoi={openPoi}
            setOpenPoi={setOpenPoi}
            openFaq={openFaq}
            setOpenFaq={setOpenFaq}
            openBasics={openBasics}
            setOpenBasics={setOpenBasics}
            openAbout={openAbout}
            setOpenAbout={setOpenAbout}
            onChildSaved={onChildSaved}
          />
        )}
      </div>

      {/* RIGHT */}
      <aside className={section}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Страны</h3>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(["all","active","home"] as const).map((k) => (
              <button
                key={k}
                className={["px-3 h-8 rounded-lg text-xs", flt===k?"bg-violet-600 text-white shadow-sm":"text-slate-700 hover:bg-slate-200"].join(" ")}
                onClick={()=>setFlt(k)}
              >
                {k==="all"?"Все": k==="active"?"Активные":"На главной"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <input
            className={inputBase}
            placeholder="Поиск по названию…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>

        <div className="max-h-[70vh] overflow-auto pr-1 space-y-2">
          {items
            .filter(it => flt==="all" || (flt==="active"? it.isActive : it.showOnHome))
            .filter(it => {
              const name = (it.title?.ru || it.title?.kk || it.title?.en || it.key).toLowerCase();
              return name.includes(q.trim().toLowerCase());
            })
            .map((it) => {
            const isSelected = selected?.id === it.id;
            return (
              <div
                key={it.id}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition",
                  isSelected
                    ? "border-violet-300 bg-violet-50"
                    : "border-slate-200 hover:bg-slate-50",
                ].join(" ")}
                draggable
                onDragStart={() => onDragStart(it.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(it.id)}
                title="Перетащи, чтобы изменить порядок"
              >
                <button
                  onClick={async () => {
                    // Optimistic open with current item
                    setSelected({
                      id: it.id,
                      key: it.key,
                      title: it.title ?? { ru: "", kk: "", en: "" },
                      imageUrl: it.imageUrl ?? "",
                      isActive: it.isActive,
                      showOnHome: it.showOnHome,
                      sortOrder: it.sortOrder,
                      heroImages: it.heroImages ?? [],
                      basics:
                        it.basics ?? {
                          timezones: [],
                          capital: { ru: "", kk: "", en: "" },
                          languages: { ru: [], kk: [], en: [] },
                          currencyCode: null,
                          currencyPerKZT: null,
                        },
                      descriptionHtml:
                        it.descriptionHtml ?? { ru: "", kk: "", en: "" },
                      cities: it.cities ?? { ru: [], kk: [], en: [] },
                      faqVisa: it.faqVisa ?? { ru: "", kk: "", en: "" },
                      faqEntry:
                        normalizeLL(it.faqEntry) ?? {
                          ru: [],
                          kk: [],
                          en: [],
                        },
                      faqReturn:
                        normalizeLL(it.faqReturn) ?? {
                          ru: [],
                          kk: [],
                          en: [],
                        },
                      poi:
                        (it.poi ?? []).map((p) => ({
                          title: p.title ?? { ru: "", kk: "", en: "" },
                          imageUrl: p.imageUrl ?? "",
                          blurb: p.blurb ?? { ru: "", kk: "", en: "" },
                        })) ?? [],
                    });
                    setOpenClimate(false);
                    setOpenCurrency(false);

                    // Fetch fresh data to avoid any stale fields
                    try {
                      const res = await fetch(`/api/destinations/admin/get?id=${encodeURIComponent(it.id)}`, { cache: "no-store" });
                      const j = await res.json().catch(() => ({}));
                      const row = j?.item;
                      if (res.ok && row) {
                        setSelected({
                          id: row.id,
                          key: row.key,
                          title: row.title ?? { ru: "", kk: "", en: "" },
                          imageUrl: row.imageUrl ?? "",
                          isActive: !!row.isActive,
                          showOnHome: !!row.showOnHome,
                          sortOrder: row.sortOrder,
                          heroImages: Array.isArray(row.heroImages) ? row.heroImages : [],
                          basics: row.basics ?? {
                            timezones: [],
                            capital: { ru: "", kk: "", en: "" },
                            languages: { ru: [], kk: [], en: [] },
                            currencyCode: null,
                            currencyPerKZT: null,
                          },
                          descriptionHtml: row.descriptionHtml ?? { ru: "", kk: "", en: "" },
                          cities: row.cities ?? { ru: [], kk: [], en: [] },
                          faqVisa: row.faqVisa ?? { ru: "", kk: "", en: "" },
                          faqEntry: normalizeLL(row.faqEntry) ?? { ru: [], kk: [], en: [] },
                          faqReturn: normalizeLL(row.faqReturn) ?? { ru: [], kk: [], en: [] },
                          poi: (row.poi ?? []).map((p: any) => ({
                            title: p.title ?? { ru: "", kk: "", en: "" },
                            imageUrl: p.imageUrl ?? "",
                            blurb: p.blurb ?? { ru: "", kk: "", en: "" },
                          })),
                        });
                      }
                    } catch {}
                  }}
                  className="min-w-0 flex-1 text-left outline-none flex items-start gap-2"
                >
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt="cover" className="h-10 w-10 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg grid place-items-center border bg-white text-lg">{flag(it.key)}</div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t(it.title) || it.key}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Chip ok={it.isActive} text="Активно" />
                      <Chip ok={it.showOnHome} text="На главной" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => remove(it.id)}
                  disabled={busy === "delete" || pending}
                  className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  title="Удалить"
                >
                  <span className="text-base leading-none">×</span>
                </button>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Пока нет направлений.
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-2">
          <button
            className="w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 active:scale-[0.99]"
            onClick={() => {
              setSelected({ ...empty, sortOrder: items.length });
              setOpenClimate(false);
              setOpenCurrency(false);
            }}
          >
            + Новый профиль
          </button>
        </div>
      </aside>
    </div>
  );
}

/* helpers */
function Chip({ ok, text }: { ok: boolean; text: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">
      <span>●</span> {text}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
      <span className="text-slate-400">●</span> нет
    </span>
  );
}

/* ================= DestinationForm ================= */

const DestinationForm = memo(function DestinationForm(props: {
  initial: FormInitial;
  onCancel: () => void;
  onSave: (p: FormInitial) => void | Promise<void>;
  busy?: boolean;

  openClimate: boolean;
  setOpenClimate: (v: boolean) => void;

  openCurrency: boolean;
  setOpenCurrency: (v: boolean) => void;

  openPoi: boolean;
  setOpenPoi: (v: boolean) => void;

  openFaq: boolean;
  setOpenFaq: (v: boolean) => void;

  openBasics: boolean;
  setOpenBasics: (v: boolean) => void;

  openAbout: boolean;
  setOpenAbout: (v: boolean) => void;

  onChildSaved: () => void;
}) {
  const {
    initial,
    onCancel,
    onSave,
    busy,
    openClimate,
    setOpenClimate,
    openCurrency,
    setOpenCurrency,
    openPoi,
    setOpenPoi,
    openFaq,
    setOpenFaq,
    openBasics,
    setOpenBasics,
    openAbout,
    setOpenAbout,
    onChildSaved,
  } = props;

  const [f, setF] = useState<FormInitial>(initial);

  // Синкать форму только когда меняется сущность (id)
  useEffect(() => {
    function toGmtLabels(input?: string[] | null): string[] {
      if (!input?.length) return [];
      const now = new Date();
      const asLabel = (iana: string) => {
        try {
          const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: iana,
            hour12: false,
            timeZoneName: "shortOffset",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).formatToParts(now);
          const off = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
          const m = off.match(/UTC([+\-]\d{2}):(\d{2})/i);
          if (!m) return "UTC";
          const sign = m[1].startsWith("-") ? "-" : "+";
          const hh = m[1].replace("+", "").replace("-", "");
          const mm = m[2];
          return `UTC${sign}${hh}:${mm}`;
        } catch {
          return "UTC";
        }
      }
      return Array.from(
        new Set(
          (input || []).map((s) =>
            s.startsWith("UTC+") || s.startsWith("UTC-") || s === "UTC" ? s : asLabel(s)
          )
        )
      );
    }

    setF({
      ...initial,
      title: initial.title ?? { ru: "", kk: "", en: "" },
      heroImages: initial.heroImages ?? [],
      basics: initial.basics
        ? { ...initial.basics, timezones: toGmtLabels(initial.basics.timezones as any) }
        : {
            timezones: [],
            capital: { ru: "", kk: "", en: "" },
            languages: { ru: [], kk: [], en: [] },
            currencyCode: null,
            currencyPerKZT: null,
          },
      descriptionHtml: initial.descriptionHtml ?? { ru: "", kk: "", en: "" },
      cities: initial.cities ?? { ru: [], kk: [], en: [] },
      faqVisa: initial.faqVisa ?? { ru: "", kk: "", en: "" },
      faqEntry: initial.faqEntry ?? { ru: [], kk: [], en: [] },
      faqReturn: initial.faqReturn ?? { ru: [], kk: [], en: [] },
      poi:
        (initial.poi ?? []).map((p) => ({
          title: p.title ?? { ru: "", kk: "", en: "" },
          imageUrl: p.imageUrl ?? "",
          blurb: p.blurb ?? { ru: "", kk: "", en: "" },
        })) ?? [],
    });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (patch: Partial<FormInitial>) => setF((p) => ({ ...p, ...patch })),
    []
  );

  const Textarea = useCallback(
    (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
      <textarea
        {...props}
        className={`min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-200 ${props.className || ""}`}
      />
    ),
    []
  );

  /* ---------- actions ---------- */
  const addPoi = () =>
    set({
      poi: [...(f.poi ?? []), { title: { ru: "", kk: "", en: "" }, imageUrl: "", blurb: { ru: "", kk: "", en: "" } }],
    });

  const removePoi = (idx: number) =>
    set({ poi: (f.poi ?? []).filter((_, i) => i !== idx) });

  const movePoi = (idx: number, dir: -1 | 1) => {
    const arr = [...(f.poi ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    set({ poi: arr });
  };

  /* ---------- render ---------- */
  return (
    <div className="grid gap-6">
      {/* БАЗОВЫЕ */}
      <section className={section}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[14.5px] font-semibold text-slate-900">Базовые</h4>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={label}>Key (уникальный)</label>
            <input
              className={inputBase}
              value={f.key}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set({ key: e.target.value })}
              placeholder="turkey, uae, thailand…"
              type="text"
            />
          </div>

          <div className="grid md:grid-cols-2">
            <div className="grid gap-1.5">
            <label className={label}>Активно</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set({ isActive: true })}
                className={[
                  "px-3 h-9 rounded-xl border text-sm",
                  f.isActive ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200",
                ].join(" ")}
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => set({ isActive: false })}
                className={[
                  "px-3 h-9 rounded-xl border text-sm",
                  !f.isActive ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200",
                ].join(" ")}
              >
                Нет
              </button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className={label}>На главной</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set({ showOnHome: true })}
                className={[
                  "px-3 h-9 rounded-xl border text-sm",
                  f.showOnHome ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200",
                ].join(" ")}
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => set({ showOnHome: false })}
                className={[
                  "px-3 h-9 rounded-xl border text-sm",
                  !f.showOnHome ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200",
                ].join(" ")}
              >
                Нет
              </button>
            </div>
          </div>
          </div>

          {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
            <div key={`title-${code}`} className="grid gap-1.5">
              <label className={label}>Название (H1, {code.toUpperCase()})</label>
              <input
                className={inputBase}
                value={f.title?.[code] ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set({ title: { ...(f.title ?? {}), [code]: e.target.value } })
                }
                placeholder={`Название (${code})`}
                type="text"
              />
            </div>
          ))}

          <div className="md:col-span-2 grid gap-1.5">
            <label className={label}>Главное изображение</label>
            <DestinationImageUploader
              value={f.imageUrl ?? null}
              onChange={(u) => set({ imageUrl: u })}
              disabled={!!busy}
            />
          </div>

          <div className="md:col-span-2 grid gap-1.5">
            <label className={label}>Hero изображения</label>
            <HeroImagesUploader
              images={f.heroImages ?? []}
              onChange={(arr) => set({ heroImages: arr })}
              max={10}
              disabled={!!busy}
            />
          </div>
        </div>
      </section>

      {/* БАЗОВАЯ ИНФОРМАЦИЯ */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenBasics(!openBasics)}
          className={sectionHdr}
        >
          <span>Базовая информация</span>
          <span className="text-slate-500">{openBasics ? "▲" : "▼"}</span>
        </button>

        {openBasics && (
          <div className="mt-3 grid gap-4">
            <div className="grid gap-1.5">
              <label className={label}>Часовые пояса (IANA/UTC)</label>
              <TimezonePicker
                value={f.basics?.timezones ?? []}
                onChange={(tzs) => set({ basics: { ...(f.basics ?? {}), timezones: tzs } })}
              />
              <p className={small}>
                Подпись вида «UTC+03:00 — Asia/Dubai». Можно выбрать несколько — если страна в нескольких зонах.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
                <div key={`cap-${code}`} className="grid gap-1.5">
                  <label className={label}>Столица ({code.toUpperCase()})</label>
                  <input
                    className={inputBase}
                    value={f.basics?.capital?.[code] ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      set({
                        basics: {
                          ...(f.basics ?? {}),
                          capital: { ...(f.basics?.capital ?? {}), [code]: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["ru", "kk", "en"] as Array<keyof LL>).map((code) => (
                <div key={`lang-${code}`} className="grid gap-1.5">
                  <label className={label}>Языки ({code.toUpperCase()}) — через запятую</label>
                  <input
                    className={inputBase}
                    value={(f.basics?.languages?.[code] ?? []).join(", ")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      set({
                        basics: {
                          ...(f.basics ?? {}),
                          languages: {
                            ...(f.basics?.languages ?? {}),
                            [code]: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ВАЛЮТА */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenCurrency(!openCurrency)}
          className={sectionHdr}
        >
          <span>Валюта</span>
          <span className="text-slate-500">{openCurrency ? "▲" : "▼"}</span>
        </button>
        {openCurrency && (
          <div className="border-t mt-3 border-slate-200 pt-3">
            <CurrencyEditor destId={f.id} destKey={f.key} onSaved={onChildSaved} />
          </div>
        )}
      </section>

      {/* О СТРАНЕ */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenAbout(!openAbout)}
          className={sectionHdr}
        >
          <span>О стране</span>
          <span className="text-slate-500">{openAbout ? "▲" : "▼"}</span>
        </button>
        {openAbout && (
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div className="grid gap-4">
              {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
                <div key={`desc-${code}`} className="grid gap-1.5">
                  <label className={label}>Большой текст ({code.toUpperCase()}) — HTML</label>
                  <Textarea
                    value={f.descriptionHtml?.[code] ?? ""}
                    onChange={(e) =>
                      set({
                        descriptionHtml: {
                          ...(f.descriptionHtml ?? {}),
                          [code]: e.target.value,
                        },
                      })
                    }
                    placeholder="<p>…</p>"
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4">
              {(["ru", "kk", "en"] as Array<keyof LL>).map((code) => (
                <div key={`cities-${code}`} className="grid gap-1.5">
                  <label className={label}>Города ({code.toUpperCase()}) — через запятую</label>
                  <input
                    className={inputBase}
                    value={(f.cities?.[code] ?? []).join(", ")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      set({
                        cities: {
                          ...(f.cities ?? {}),
                          [code]: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* КЛИМАТ */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenClimate(!openClimate)}
          className={sectionHdr}
        >
          <span>Климат (t°/влажность/вода по месяцам)</span>
          <span className="text-slate-500">{openClimate ? "▲" : "▼"}</span>
        </button>
        {openClimate && (
          <div className="border-t mt-3 border-slate-200 pt-3">
            <ClimateEditor destId={f.id} destKey={f.key} onSaved={onChildSaved} />
          </div>
        )}
      </section>

      {/* POI / Stories */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenPoi(!openPoi)}
          className={sectionHdr}
        >
          <span>POI / Stories</span>
          <span className="text-slate-500">{openPoi ? "▲" : "▼"}</span>
        </button>

        {openPoi && (
          <div className="mt-3 grid gap-3">
            {(f.poi ?? []).map((p, idx) => (
              <div
                key={`poi-${idx}`}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    Блок #{idx + 1}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                      onClick={() => movePoi(idx, -1)}
                      title="Вверх"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                      onClick={() => movePoi(idx, 1)}
                      title="Вниз"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                      onClick={() => removePoi(idx)}
                      title="Удалить"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                  <div className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
                        <input
                          key={`poi-title-${idx}-${code}`}
                          className={inputBase}
                          placeholder={`Заголовок (${code})`}
                          value={p.title?.[code] ?? ""}
                          onChange={(e) => {
                            const arr = [...(f.poi ?? [])];
                            arr[idx] = {
                              ...arr[idx],
                              title: { ...(arr[idx].title ?? {}), [code]: e.target.value },
                            };
                            set({ poi: arr });
                          }}
                        />
                      ))}
                    </div>

                    <div className="grid gap-2">
                      {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
                        <Textarea
                          key={`poi-blurb-${idx}-${code}`}
                          placeholder={`Короткое описание (${code})`}
                          value={p.blurb?.[code] ?? ""}
                          onChange={(e) => {
                            const arr = [...(f.poi ?? [])];
                            arr[idx] = {
                              ...arr[idx],
                              blurb: { ...(arr[idx].blurb ?? {}), [code]: e.target.value },
                            };
                            set({ poi: arr });
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={label}>Изображение</label>
                    <DestinationImageUploader
                      value={p.imageUrl ?? null}
                      onChange={(u) => {
                        const arr = [...(f.poi ?? [])];
                        arr[idx] = { ...arr[idx], imageUrl: u };
                        set({ poi: arr });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addPoi}
                className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 active:scale-[0.99]"
              >
                + Добавить блок
              </button>
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className={section}>
        <button
          type="button"
          onClick={() => setOpenFaq(!openFaq)}
          className={sectionHdr}
        >
          <span>FAQ</span>
          <span className="text-slate-500">{openFaq ? "▲" : "▼"}</span>
        </button>

        {openFaq && (
          <div className="mt-3 grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              {(["ru", "kk", "en"] as Array<keyof L>).map((code) => (
                <div key={`visa-${code}`} className="grid gap-1.5">
                  <label className={label}>Виза ({code.toUpperCase()}) — абзац</label>
                  <Textarea
                    value={f.faqVisa?.[code] ?? ""}
                    onChange={(e) =>
                      set({ faqVisa: { ...(f.faqVisa ?? {}), [code]: e.target.value } })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["ru", "kk", "en"] as Array<keyof LL>).map((code) => (
                <div key={`entry-${code}`} className="grid gap-1.5">
                  <label className={label}>
                    Условия въезда ({code.toUpperCase()}) — по одному пункту на строку (3–6)
                  </label>
                  <Textarea
                    value={joinLines(f.faqEntry?.[code])}
                    onChange={(e) =>
                      set({
                        faqEntry: {
                          ...(f.faqEntry ?? {}),
                          [code]: splitLines(e.target.value),
                        },
                      })
                    }
                    placeholder={"Паспорт...\nСтраховка...\nБилеты..."}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["ru", "kk", "en"] as Array<keyof LL>).map((code) => (
                <div key={`ret-${code}`} className="grid gap-1.5">
                  <label className={label}>
                    Условия возвращения ({code.toUpperCase()}) — по одному пункту на строку (1–3)
                  </label>
                  <Textarea
                    value={joinLines(f.faqReturn?.[code])}
                    onChange={(e) =>
                      set({
                        faqReturn: {
                          ...(f.faqReturn ?? {}),
                          [code]: splitLines(e.target.value),
                        },
                      })
                    }
                    placeholder={"Ничего особенного...\nИ т.п."}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* actions */}
      <div className="sticky bottom-0 -mx-2 md:mx-0">
        <div className="border-t border-slate-200 bg-white/85 backdrop-blur px-3 md:px-0 py-3 flex items-center justify-end gap-2 rounded-b-2xl">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={() => onSave(f)} disabled={busy}>
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
});

const MemoDestinationForm = DestinationForm;
