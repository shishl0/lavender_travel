"use client";
import { useEffect, useMemo, useState } from "react";

/** "UTC+04:00" → +240 (минуты) */
function parseUtcMinutes(label: string): number {
  const m = label.trim().match(/^UTC([+\-])(\d{2}):(\d{2})$/i);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = parseInt(m[2], 10);
  const mm = parseInt(m[3], 10);
  return sign * (hh * 60 + mm);
}

/** IANA → минуты смещения через Intl */
function ianaMinutes(tz: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      hour12: false,
      timeZoneName: "longOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
    const norm = name.replace(/^GMT/i, "UTC");
    return parseUtcMinutes(norm === "UTC" ? "UTC+00:00" : norm);
  } catch {
    return 0;
  }
}

/** Универсально: "UTC±HH:MM|City" | "UTC±HH:MM" | IANA */
function splitZone(z: string): { utc: string | null; city: string | null; raw: string } {
  const s = String(z).trim();
  if (s.includes("|")) {
    const [utc, city] = s.split("|");
    return { utc: utc || null, city: (city || "").trim() || null, raw: s };
  }
  if (/^UTC[+\-]\d{2}:\d{2}$/i.test(s)) return { utc: s.toUpperCase(), city: null, raw: s };
  return { utc: null, city: null, raw: s }; // возможно IANA
}

function minutesOf(zone: string, at: Date): number {
  const { utc, raw } = splitZone(zone);
  if (utc) return parseUtcMinutes(utc);
  return ianaMinutes(raw, at);
}

function labelUtc(zone: string, at: Date): string {
  const { utc, raw } = splitZone(zone);
  if (utc) return utc.toUpperCase();
  // IANA → UTC±
  const m = minutesOf(raw, at);
  const sign = m < 0 ? "-" : "+";
  const abs = Math.abs(m);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function cityNameOf(zone: string): string {
  const { city, raw, utc } = splitZone(zone);
  if (city) return city;

  if (utc) return ""; // только UTC — города нет

  // IANA → красивое имя
  if (/^[A-Za-z]+\/[A-Za-z_]+/.test(raw)) {
    const pretty = raw.split("/").pop()!.replace(/_/g, " ");
    const dict: Record<string, string> = {
      Dubai: "Дубай",
      Istanbul: "Стамбул",
      Antalya: "Анталья",
      Bangkok: "Бангкок",
      Almaty: "Алматы",
      Tbilisi: "Тбилиси",
      Cairo: "Каир",
      Moscow: "Москва",
    };
    return dict[pretty] || pretty;
  }
  return "";
}

export default function LiveTime({
  zones,
  locale = "ru-RU",
}: {
  zones?: string[];
  locale?: string;
}) {
  const safeZones = useMemo(
    () => (Array.isArray(zones) ? Array.from(new Set(zones)).filter(Boolean) : []),
    [zones]
  );

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000); // тикаем каждую секунду
    return () => clearInterval(id);
  }, []);

  if (!safeZones.length) return null;

  // Скелетон до монтирования — чтобы не словить гидрацию
  if (!mounted || !now) {
    return (
      <div className="grid gap-3">
        {safeZones.map((z, i) => (
          <div
            key={`${i}-${z}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 md:px-5 md:py-4 shadow-sm bg-white/70"
          >
            <div className="min-w-0">
              <div className="text-base md:text-lg font-semibold leading-tight truncate">—</div>
              <div className="text-xs md:text-sm text-slate-500">—</div>
            </div>
            <div className="text-right">
              <div className="text-sm md:text-base text-slate-600">—</div>
              <div className="text-xl md:text-2xl font-bold tabular-nums tracking-tight">—:—:—</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // «здесь» в минутах, чтобы вычислить целевое время
  const hereIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hereMin = minutesOf(hereIana, now);

  return (
    <div className="grid gap-3">
      {safeZones.map((z) => {
        const targetMin = minutesOf(z, now);
        const deltaMin = targetMin - hereMin;
        const dt = new Date(now.getTime() + deltaMin * 60_000);

        const place = cityNameOf(z) || labelUtc(z, now); // слева — город, если есть; иначе сам UTC
        const utc = labelUtc(z, now);

        const dateStr = dt.toLocaleDateString(locale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const timeStr = dt.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        return (
          <div
            key={z}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 md:px-5 md:py-4 shadow-sm bg-white/70"
          >
            <div className="min-w-0">
              <div className="text-base md:text-lg font-semibold leading-tight truncate">{place}</div>
              <div className="text-xs md:text-sm text-slate-500">{utc}</div>
            </div>

            <div className="text-right">
              <div className="text-sm md:text-base text-slate-600">{dateStr}</div>
              <div className="text-xl md:text-2xl font-bold tabular-nums tracking-tight">{timeStr}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}