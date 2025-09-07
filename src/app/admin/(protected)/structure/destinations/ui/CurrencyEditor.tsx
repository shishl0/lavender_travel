"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type IsoCurrency = { code: string; description: string };

const COUNTRY_TO_CCY: Record<string, string> = {
  TR:"TRY", AE:"AED", TH:"THB", VN:"VND", EG:"EGP", GE:"GEL", KZ:"KZT",
  US:"USD", GB:"GBP", EU:"EUR", DE:"EUR", FR:"EUR", ES:"EUR", IT:"EUR",
  RU:"RUB", UA:"UAH", BY:"BYN", KG:"KGS", UZ:"UZS", CN:"CNY", JP:"JPY",
  TUR:"TRY", ARE:"AED", THA:"THB", VNM:"VND", EGY:"EGP", GEO:"GEL", KAZ:"KZT",
  USA:"USD", GBR:"GBP", RUS:"RUB",
  turkey:"TRY", uae:"AED", dubai:"AED", thailand:"THB", vietnam:"VND",
  egypt:"EGP", georgia:"GEL", kazakhstan:"KZT", russia:"RUB", europe:"EUR",
  germany:"EUR", france:"EUR", italy:"EUR", spain:"EUR", uk:"GBP", usa:"USD",
  antalya:"TRY", istanbul:"TRY",
};

function normalizeCountryHint(h?: string | null): string | null {
  if (!h) return null;
  const s = h.trim();
  if (!s) return null;
  if (s.length === 2 || s.length === 3) return s.toUpperCase();
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

const dedupeSort = (arr: IsoCurrency[]) =>
  Array.from(new Map(arr.map(x => [x.code.toUpperCase(), { code: x.code.toUpperCase(), description: x.description || x.code }])).values())
    .sort((a,b)=>a.code.localeCompare(b.code));

async function fetchJson(url: string, opts?: RequestInit, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res.ok ? res.json() : null;
  } catch { return null; } finally { clearTimeout(id); }
}
async function loadRemoteSymbols(): Promise<IsoCurrency[]> {
  const j = await fetchJson("https://api.exchangerate.host/symbols", { cache: "force-cache" });
  if (!j?.symbols) return [];
  return Object.keys(j.symbols).map((k: string) => ({ code: k, description: j.symbols[k]?.description ?? k }));
}
async function loadLocalSymbols(): Promise<IsoCurrency[]> {
  const j = await fetchJson("/iso4217.json", { cache: "force-cache" });
  if (!Array.isArray(j)) return [];
  return (j as any[]).map(x => ({ code: x.code, description: x.name || x.description || x.code }));
}

/* курс теперь берём с /api/destinations/admin/currency?probe=XXX */
async function fetchKztRate(code: string): Promise<number | null> {
  const j = await fetchJson(`/api/destinations/admin/currency?probe=${encodeURIComponent(code)}`, { cache: "no-store" }, 8000);
  const r = j?.rate;
  return Number.isFinite(r) ? Number(r) : null;
}

export default function CurrencyEditor({
  destId, destKey, countryHint, onSaved,
}: {
  destId?: string | null;
  destKey?: string | null;
  countryHint?: string | null;
  onSaved?: () => void;
}) {
  const [symbols, setSymbols] = useState<IsoCurrency[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const [code, setCode] = useState<string>("");
  const [rate, setRate] = useState<number | null>(null);

  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastReq = useRef(0);

  // загрузим сохранённый код
  useEffect(() => {
    (async () => {
      if (!destId && !destKey) return;
      try {
        const qs = destId ? `id=${destId}` : `key=${encodeURIComponent(destKey!)}`;
        const j = await fetchJson(`/api/destinations/admin/currency?${qs}`, { cache: "no-store" });
        const cur = j?.item?.currencyCode ?? "";
        if (cur) setCode(cur);
      } catch {}
    })();
  }, [destId, destKey]);

  // список символов
  useEffect(() => {
    (async () => {
      setLoadingSymbols(true);
      const remote = await loadRemoteSymbols();
      const local  = await loadLocalSymbols();
      setSymbols(dedupeSort([...remote, ...local]));
      setLoadingSymbols(false);
    })();
  }, []);

  // авто-подстановка по стране/ключу
  useEffect(() => {
    if (code) return;
    const norm = normalizeCountryHint(countryHint) || normalizeCountryHint(destKey || null);
    if (!norm) return;
    const guess =
      COUNTRY_TO_CCY[norm] ||
      COUNTRY_TO_CCY[norm.toLowerCase()] ||
      COUNTRY_TO_CCY[norm.toUpperCase()];
    if (guess) setCode(guess);
  }, [countryHint, destKey, code]);

  // получить курс
  const requestRate = useCallback(async (c: string) => {
    if (!c) return;
    setLoadingRate(true);
    const reqId = Date.now(); lastReq.current = reqId;
    const r = await fetchKztRate(c);
    if (lastReq.current !== reqId) return;
    setRate(r);
    setLoadingRate(false);
  }, []);

  // при смене кода подтянуть курс
  useEffect(() => {
    if (code) requestRate(code);
    else setRate(null);
  }, [code, requestRate]);

  const filtered = useMemo(() => {
    if (!query.trim()) return symbols;
    const q = query.trim().toLowerCase();
    return symbols.filter(s => s.code.toLowerCase().includes(q) || (s.description||"").toLowerCase().includes(q));
  }, [symbols, query]);

  const quickChoices = Array.from(new Set(["KZT","USD","EUR", code].filter(Boolean)));

  const onSave = async () => {
    if (!code || !(destId || destKey)) return;
    setSaving(true);
    try {
      const payload = { ...(destId ? { id: destId } : { key: destKey }), currencyCode: code };
      const res = await fetch("/api/destinations/admin/currency", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      onSaved?.();
      alert("Валюта сохранена");
    } catch (e) {
      console.error(e);
      alert("Ошибка сохранения валюты");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {/* быстрый выбор */}
      <div className="grid gap-2">
        <label className="text-sm text-slate-700">Валюта страны</label>
        <div className="flex flex-wrap gap-2">
          {quickChoices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCode(c!)}
              className={`px-3 py-1.5 rounded-xl border text-sm ${code===c ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-sm"
          >
            {showAll ? "Скрыть список" : "Показать все"}
          </button>
        </div>
      </div>

      {/* полный список */}
      {showAll && (
        <div className="grid gap-2">
          <input
            className="h-[38px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px]"
            placeholder="Поиск по коду/названию…"
            value={query} onChange={(e)=>setQuery(e.target.value)}
          />
          <select
            className="mt-1 h-auto w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px]"
            size={12} value={code} onChange={(e)=>setCode(e.target.value)}
          >
            <option value="" disabled>{loadingSymbols ? "Загружаем список…" : "— выберите валюту —"}</option>
            {filtered.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.description}</option>
            ))}
          </select>
        </div>
      )}

      {/* курс (read-only, с нашего API) */}
      <div className="flex items-center flex-wrap gap-2">
        <button type="button" onClick={() => requestRate(code)} disabled={!code || loadingRate} className="btn btn-secondary">
          {loadingRate ? "Загрузка…" : "Обновить курс"}
        </button>
        <span className="text-sm text-slate-600">
          Курс: <b>{rate != null ? `1 ${code} = ${rate.toFixed(3)} ₸` : "—"}</b>{" "}
          <span className="text-slate-400">(кэш 10 мин)</span>
        </span>
      </div>

      <div>
        <button type="button" onClick={onSave} disabled={!code || saving} className="btn btn-primary">
          {saving ? "Сохранение…" : "Сохранить валюту"}
        </button>
      </div>
    </div>
  );
}