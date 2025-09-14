"use client";
import { useEffect, useMemo, useState } from "react";

/* ---------------- helpers ---------------- */
function allIana(): string[] {
  // @ts-ignore
  if (Intl.supportedValuesOf) return (Intl.supportedValuesOf("timeZone") as string[]) || [];
  return ["UTC","Europe/London","Europe/Berlin","Europe/Moscow","Asia/Dubai","Asia/Almaty","Asia/Bangkok"];
}

function normalizeUtcLabel(raw: string): { label: string; minutes: number } {
  const s = raw.trim().toUpperCase();
  if (s === "UTC" || s === "GMT") return { label: "UTC+00:00", minutes: 0 };
  const m = s.match(/^(UTC|GMT)\s*([+\-])?(\d{1,2})(?::?(\d{2}))?$/i);
  if (!m) return { label: "UTC+00:00", minutes: 0 };
  const sign = (m[2] || "+") === "-" ? -1 : 1;
  const hh = Math.min(14, parseInt(m[3] || "0", 10));
  const mm = Math.min(59, parseInt(m[4] || "0", 10));
  const minutes = sign * (hh * 60 + mm);
  const label = `UTC${sign === -1 ? "-" : "+"}${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  return { label, minutes };
}

/** IANA → UTC±HH:MM (учёт DST на момент at) */
function ianaToUtcLabel(tz: string, at: Date): { label: string; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      hour12: false,
      timeZoneName: "longOffset",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(at);
    const off = parts.find(p => p.type === "timeZoneName")?.value || "UTC";
    return normalizeUtcLabel(off.replace(/^GMT/i,"UTC"));
  } catch {
    return { label: "UTC+00:00", minutes: 0 };
  }
}

const debounce = (fn: (...a:any[])=>void, ms=450) => { let t:any; return (...a:any[]) => { clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
const isUtcQuery = (s:string) => /^UTC\s*[+\-]?\d{0,2}(:\d{2})?$/i.test(s.trim());
const compactCity = (display:string) => display.split(",")[0]?.trim() || display.trim();

/* ---------------- remote search via Open-Meteo ---------------- */
type GeoItem = {
  id?: number; name: string; country?: string; latitude: number; longitude: number; timezone?: string;
};
async function searchCities(q: string): Promise<GeoItem[]> {
  if (!q.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=10&language=ru&format=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const j = await res.json();
    const list = (j?.results || []) as any[];
    return list.map(r => ({
      id: r?.id,
      name: [r?.name, r?.admin1, r?.country].filter(Boolean).join(", "),
      country: r?.country,
      latitude: r?.latitude,
      longitude: r?.longitude,
      timezone: r?.timezone,
    }));
  } catch { return []; }
}

/* ---------------- component ---------------- */
export default function TimezonePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (labels: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date());
  const [cityResults, setCityResults] = useState<Array<{ display: string; gmt: string; minutes: number }>>([]);
  const [loading, setLoading] = useState(false);

  // DnD
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);

  const allOffsets = useMemo(() => {
    const map = new Map<string, number>();
    for (const tz of allIana()) {
      const { label, minutes } = ianaToUtcLabel(tz, now);
      if (!map.has(label)) map.set(label, minutes);
    }
    return Array.from(map.entries()).map(([label, minutes]) => ({ label, minutes })).sort((a,b)=>a.minutes-b.minutes);
  }, [now]);

  const doSearch = useMemo(() =>
    debounce(async (q: string) => {
      const text = q.trim();
      if (!text || isUtcQuery(text)) {
        setCityResults([]); setLoading(false); return;
      }
      setLoading(true);
      const found = await searchCities(text);
      const enriched = found
        .map(g => { const { label, minutes } = ianaToUtcLabel(g.timezone || "UTC", now); return { display: g.name, gmt: label, minutes }; })
        .reduce((acc, x) => (acc.some(y => y.display===x.display && y.gmt===x.gmt) ? acc : [...acc, x]), [] as typeof cityResults)
        .sort((a,b)=>a.minutes-b.minutes);
      setCityResults(enriched);
      setLoading(false);
    }, 450)
  , [now]);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  /** storage utils */
  const uniq = (arr: string[]) => Array.from(new Set(arr));
  const addToken = (token: string) => onChange(uniq([...(value||[]), token]));
  const setAtIndex = (i:number, token:string) => onChange((value||[]).map((v,idx)=> idx===i ? token : v));
  const removeAtIndex = (i:number) => onChange((value||[]).filter((_,idx)=> idx!==i));
  const removeAllForUtc = (utc: string) => onChange((value||[]).filter(v => v.split("|")[0] !== utc));
  const makeToken = (utc: string, city?: string) => (city && city.length ? `${utc}|${city}` : utc);

  /** checkbox behavior (smart replace per UTC) */
  const toggleSmart = (utc: string) => {
    const city = !isUtcQuery(query) ? compactCity(query) : "";
    const tokenWithCity = makeToken(utc, city);
    const hasForUtc = (value||[]).some(v => v.split("|")[0] === utc);
    const hasExact  = (value||[]).includes(city ? tokenWithCity : utc);

    if (hasExact) {
      // remove exact
      onChange((value||[]).filter(v => v !== (city ? tokenWithCity : utc)));
    } else {
      // replace per UTC
      const rest = (value||[]).filter(v => v.split("|")[0] !== utc);
      onChange(uniq([...rest, city ? tokenWithCity : utc]));
    }
  };

  const isChecked = (utc: string) => (value||[]).some(v => v.split("|")[0] === utc);

  const hasQuery = !!query.trim();
  const isCityMode = hasQuery && !isUtcQuery(query);
  const filteredOffsets = useMemo(() => {
    if (!hasQuery) return [];
    const q = query.trim().toLowerCase();
    if (isUtcQuery(q)) return allOffsets;
    return allOffsets.filter(o => o.label.toLowerCase().includes(q));
  }, [allOffsets, hasQuery, query]);

  const pretty = (val: string) => { const [utc, city] = val.split("|"); return city ? `${utc} — ${city}` : utc; };

  /** ------ CRUD + DnD for selected ------ */
  type SelectedItem = { token: string; utc: string; city: string | null };
  const selected: SelectedItem[] = (value||[]).map(t => {
    const [utc, city] = String(t).split("|");
    return { token: t, utc, city: city?.trim() || null };
  });

  const onDragStart = (idx:number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (overIdx:number) => {
    if (dragIdx===null || dragIdx===overIdx) return;
    const arr = [...(value||[])];
    const [m] = arr.splice(dragIdx,1);
    arr.splice(overIdx,0,m);
    onChange(arr);
    setDragIdx(null);
  };

  const onCityEdit = (idx:number, nextCity:string) => {
    const { utc } = selected[idx];
    const token = makeToken(utc, nextCity.trim());
    // замена без выкидывания других UTC — сохраняем порядок
    setAtIndex(idx, token);
  };

  return (
    <div className="grid gap-3">
      <input
        className="h-[40px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px]"
        placeholder="Город или UTC+03… (например, Dubai / Antalya / Bangkok)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Выбранные (CRUD + DnD) */}
      {selected.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium bg-slate-50">Выбранные (перетащи для порядка)</div>
          <ul>
            {selected.map((it, idx) => (
              <li
                key={`${it.token}-${idx}`}
                className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 bg-white"
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx)}
                title="Перетащи для изменения порядка"
              >
                <span className="cursor-grab select-none text-slate-400">⋮⋮</span>

                <span className="text-xs rounded border px-2 py-0.5 bg-slate-50">{it.utc}</span>

                <input
                  className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-sm"
                  placeholder="Город (необязательно)"
                  value={it.city ?? ""}
                  onChange={(e) => onCityEdit(idx, e.target.value)}
                />

                <button
                  type="button"
                  className="text-rose-600 text-sm px-2 py-1 rounded hover:bg-rose-50"
                  onClick={() => removeAtIndex(idx)}
                  title="Удалить"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Города */}
      {isCityMode && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium bg-slate-50">
            Результаты по городам {loading ? "· поиск…" : cityResults.length ? `· ${cityResults.length}` : "· нет"}
          </div>
          {loading ? (
            <div className="px-3 py-3 text-sm text-slate-500">Ищем…</div>
          ) : cityResults.length ? (
            <ul className="max-h-56 overflow-auto">
              {cityResults.map((r, i) => (
                <li key={`${r.display}_${r.gmt}_${i}`} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => addToken(makeToken(r.gmt, compactCity(r.display)))}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50"
                    title="Добавить этот часовой пояс с городом"
                  >
                    <div className="text-sm font-medium">{r.display}</div>
                    <div className="text-xs text-slate-500">{r.gmt}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-3 text-sm text-slate-500">Ничего не нашли.</div>
          )}
        </div>
      )}

      {/* Офсеты */}
      {hasQuery && filteredOffsets.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium bg-slate-50">Совпадения по смещению (UTC)</div>
          <div className="max-h-56 overflow-auto">
            {filteredOffsets.map(({ label }) => (
              <label key={label} className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={isChecked(label)} onChange={() => toggleSmart(label)} />
                <div className="text-sm font-medium">{label}</div>
              </label>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}