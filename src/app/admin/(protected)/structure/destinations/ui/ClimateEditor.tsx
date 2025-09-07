"use client";

import React, { useEffect, useState } from "react";

/* ================= Types ================= */

type GeoItem = {
  id?: number;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string | null;
};

type MonthPack = {
  yearUsing: number;
  source: string | null;
  airC: (number | null)[];
  waterC: (number | null)[];
  humidity: (number | null)[];
  meta: Record<string, any>;
};

type GetApiResponse = {
  item?: {
    destinationId: string;
    key: string;
    latitude: number | null;
    longitude: number | null;
    source: string | null;
    months: MonthPack | null;
    updatedAt: string | null;
  };
};

type PostApiResponse = {
  ok: boolean;
  id: string;
  months: MonthPack;
};

/* ================ Helpers ================ */

const fmt = (x: number | null) => (x == null ? "—" : x.toString());

async function searchGeo(q: string): Promise<GeoItem[]> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
  console.log("[geo] URL:", url);

  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();
  console.log("[geo] RAW:", res.status, txt);

  if (!res.ok) return [];
  const j = JSON.parse(txt);
  const list = (j?.results || []) as any[];

  return list.map((r) => ({
    id: r?.id,
    name: [r?.name, r?.admin1, r?.country].filter(Boolean).join(", "),
    country: r?.country,
    latitude: r?.latitude,
    longitude: r?.longitude,
    timezone: r?.timezone ?? null,
  }));
}

/* ============== Component ============== */

export default function ClimateEditor({
  destId,
  destKey,
  onSaved,
}: {
  destId?: string | null;
  destKey?: string | null;
  onSaved?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoItem[]>([]);
  const [pick, setPick] = useState<GeoItem | null>(null);

  const [months, setMonths] = useState<MonthPack | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  // Подтянуть, что уже есть в БД
  useEffect(() => {
    (async () => {
      if (!destId && !destKey) {
        setLoadingInit(false);
        return;
      }
      const qs = destId ? `id=${destId}` : `key=${encodeURIComponent(destKey!)}`;
      const url = `/api/destinations/admin/climate?${qs}`;
      console.log("[GET climate] →", url);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const txt = await res.text();
        console.log("[GET climate] RAW:", res.status, txt);
        if (!res.ok) return;
        const data = JSON.parse(txt) as GetApiResponse;

        const m = data.item?.months ?? null;
        if (m) setMonths(m);

        const lat = data.item?.latitude;
        const lon = data.item?.longitude;
        const name = data.item?.key ?? "point";
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setPick({ name, latitude: lat as number, longitude: lon as number, timezone: null });
        }
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [destId, destKey]);

  // Поиск города/точки
  const doSearch = async () => {
    if (!query.trim()) return;
    setLoadingSearch(true);
    try {
      const list = await searchGeo(query.trim());
      console.log("[geo] parsed:", list);
      setResults(list);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Посчитать и сохранить в БД (сервер сам агрегирует из ERA5/Marine)
  const computeAndSave = async () => {
    if (!(destId || destKey) || !pick) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...(destId ? { id: destId } : { key: destKey }),
        latitude: pick.latitude,
        longitude: pick.longitude,
      };
      console.log("[POST climate] payload:", payload);

      const res = await fetch("/api/destinations/admin/climate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      console.log("[POST climate] RAW:", res.status, txt);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${txt}`);
      const data = JSON.parse(txt) as PostApiResponse;
      if (!data.ok) throw new Error("API ok=false");

      setMonths(data.months);
      console.log("[POST climate] parsed months:", data.months);
      onSaved?.();
      alert("Климат пересчитан и сохранён");
    } catch (e) {
      console.error("compute/save error:", e);
      alert("Ошибка сохранения климата");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Поиск точки */}
      <div className="grid gap-2">
        <label className="text-sm text-slate-700">Страна/город (Open-Meteo)</label>
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Dubai, Antalya, Bangkok…"
          />
          <button className="btn" onClick={doSearch} disabled={loadingSearch}>
            {loadingSearch ? "Поиск…" : "Найти"}
          </button>
        </div>

        {!!results.length && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {results.map((r) => (
              <button
                key={`${r.latitude},${r.longitude}`}
                onClick={() => {
                  setPick(r);
                  setResults([]);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b last:border-b-0"
              >
                {r.name}{" "}
                <span className="text-xs text-slate-500">
                  ({r.latitude.toFixed(3)}, {r.longitude.toFixed(3)})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 items-center">
        <button
          className="btn btn-primary"
          disabled={!pick || saving}
          onClick={computeAndSave}
          title="Тянет ERA5+Marine за последние 12 полных месяцев и сохраняет в БД"
        >
          {saving ? "Считаю…" : "Посчитать и сохранить"}
        </button>

        {pick && (
          <span className="text-sm text-slate-600">
            Точка: {pick.name} ({pick.latitude.toFixed(3)}, {pick.longitude.toFixed(3)})
          </span>
        )}
      </div>

      {/* Таблица */}
      {months && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 text-sm font-medium bg-slate-50">
            Сводка по месяцам — источник: {months.source ?? "—"}
          </div>
          <div className="overflow-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-3 py-2 text-left">Месяц</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-3 py-2">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-medium">Воздух, °C</td>
                  {months.airC.map((v, i) => (
                    <td key={i} className="px-3 py-2">
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/60">
                  <td className="px-3 py-2 font-medium">Вода, °C</td>
                  {months.waterC.map((v, i) => (
                    <td key={i} className="px-3 py-2">
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Влажность, %</td>
                  {months.humidity.map((v, i) => (
                    <td key={i} className="px-3 py-2">
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Метаданные источников */}
          {!!months.meta && (
            <div className="px-3 py-2 text-xs text-slate-500 border-t bg-slate-50/60">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(months.meta, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {loadingInit && <div className="text-sm text-slate-500">Загрузка…</div>}
    </div>
  );
}