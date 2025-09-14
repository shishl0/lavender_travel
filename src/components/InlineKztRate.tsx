
"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_MS = 10 * 60 * 1000;

type Props = {
  /** Предпочитаемый ISO-код валюты (если нет данных у направления) */
  code?: string | null;
  /** Для чтения сохранённого курса направления */
  destId?: string;
  destKey?: string;
};

export default function InlineKztRate({ code, destId, destKey }: Props) {
  const [ccy, setCcy] = useState<string | null>(code ?? null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<any>(null);

  const pretty = (n: number) =>
    n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function load() {
    // приоритет: id/key → читаем сохранённое; иначе probe по коду
    if (!(destId || destKey) && !ccy) return;

    setLoading(true);
    setErr(null);
    try {
      let url = "";
      if (destId || destKey) {
        const qs = destId ? `id=${encodeURIComponent(destId)}` : `key=${encodeURIComponent(destKey!)}`;
        url = `/api/destinations/admin/currency?${qs}`;
      } else {
        url = `/api/destinations/admin/currency?probe=${encodeURIComponent(ccy!)}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(j?.error || "fetch failed");

      // ответ в режиме item (id/key) или probe (code)
      const nextCode = j?.item?.currencyCode ?? j?.probe ?? ccy ?? null;
      const nextRate =
        j?.item?.rate ?? j?.item?.currencyRateToKzt ?? j?.rate ?? null;

      setCcy(nextCode);
      setRate(typeof nextRate === "number" ? nextRate : null);
    } catch (e: any) {
      setErr(e?.message || "error");
      setRate(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCcy(code ?? null);
  }, [code]);

  useEffect(() => {
    // первая загрузка + таймер
    load();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(load, REFRESH_MS);
    return () => timer.current && clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccy, destId, destKey]);

  if (!ccy) return <span>—</span>;

  return (
    <span title="Курс к тенге обновляется каждые 10 минут">
      <b>{ccy}</b>{" "}
      {rate != null ? (
        <> ≈ {pretty(rate)} ₸</>
      ) : loading ? (
        "• загрузка…"
      ) : err ? (
        "• нет данных"
      ) : (
        ""
      )}{" "}
    </span>
  );
}