import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Кэш живёт в nodejs-процессе */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 10 минут */
const TTL_MS = 10 * 60 * 1000;
type CacheEntry = { value: number; ts: number; provider: string };

const G = globalThis as any;
if (!G.__RATE_CACHE_ADMIN__) G.__RATE_CACHE_ADMIN__ = new Map<string, CacheEntry>();
const RATE_CACHE: Map<string, CacheEntry> = G.__RATE_CACHE_ADMIN__;

const ISO3 = /^[A-Z]{3}$/;
const ALIASES: Record<string, string> = { RUR: "RUB", BYR: "BYN" };

/* ---------- safe fetch with timeout ---------- */
async function fetchJson(url: string, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "user-agent": "lavender.travel/1.0 (+admin-currency)" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

/* ---------- providers ---------- */
async function providerExchangerateHost(code: string): Promise<CacheEntry | null> {
  const j = await fetchJson(`https://api.exchangerate.host/latest?base=${encodeURIComponent(code)}&symbols=KZT`);
  const r = j?.rates?.KZT;
  if (Number.isFinite(r)) return { value: Number(r), ts: Date.now(), provider: "exchangerate.host" };
  return null;
}
async function providerERAPI(code: string): Promise<CacheEntry | null> {
  const j = await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(code)}`);
  const r = j?.rates?.KZT;
  if (Number.isFinite(r)) return { value: Number(r), ts: Date.now(), provider: "open.er-api.com" };
  return null;
}

function normalizeCcy(raw: string | null | undefined): string | null {
  let s = (raw || "").trim().toUpperCase();
  if (ALIASES[s]) s = ALIASES[s];
  if (!ISO3.test(s)) return null;
  return s;
}

async function getRateToKzt(base: string): Promise<CacheEntry | null> {
  const c = base.toUpperCase();
  if (c === "KZT") {
    const entry: CacheEntry = { value: 1, ts: Date.now(), provider: "self" };
    RATE_CACHE.set(c, entry);
    return entry;
  }
  const cached = RATE_CACHE.get(c);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached;

  const providers = [providerExchangerateHost, providerERAPI];
  for (const p of providers) {
    const got = await p(c);
    if (got) {
      RATE_CACHE.set(c, got);
      return got;
    }
  }
  if (cached) return cached;
  return null;
}

/* ---------- GET /api/destinations/admin/currency ---------- */
/** Режимы:
 *  - ?id=... | ?key=...                      → отдать сохранённую валюту направления
 *  - ?probe=USD  (или ?code=USD)             → посчитать курс к KZT (без записи)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;
    const key = searchParams.get("key") || undefined;
    const probeRaw = searchParams.get("probe") || searchParams.get("code") || undefined;

    // режим "просто посчитать курс"
    if (probeRaw) {
      const code = normalizeCcy(probeRaw);
      if (!code) return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
      const rate = await getRateToKzt(code);
      if (!rate) return NextResponse.json({ error: "Rate fetch failed" }, { status: 503 });
      return NextResponse.json({
        ok: true,
        probe: code,
        base: "KZT",
        rate: rate.value,
        provider: rate.provider,
        cachedAt: Date.now(),
      });
    }

    // режим "прочитать сохранённое у направления"
    if (!id && !key) {
      return NextResponse.json({ error: "Provide destination id or key" }, { status: 400 });
    }
    const where = id ? { id } : { key: String(key) };
    const dest = await prisma.destination.findFirst({
      where,
      select: {
        id: true,
        key: true,
        basics: true,
        currencyCode: true,
        currencyBase: true,
        currencyRateToKzt: true,
        currencyProvider: true,
        currencyUpdatedAt: true,
      },
    });
    if (!dest) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

    const savedCode =
      (dest.basics as any)?.currencyCode || dest.currencyCode || null;

    return NextResponse.json({
      ok: true,
      item: {
        id: dest.id,
        key: dest.key,
        currencyCode: savedCode,
        base: dest.currencyBase || "KZT",
        rate: dest.currencyRateToKzt ?? null,
        provider: dest.currencyProvider ?? null,
        updatedAt: dest.currencyUpdatedAt?.toISOString?.() ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

/* ---------- POST /api/destinations/admin/currency ---------- */
/** Сохраняет код и текущий курс в БД */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id: string | undefined = body?.id || undefined;
    const key: string | undefined = body?.key || undefined;
    const codeRaw: string | undefined = body?.currencyCode || body?.code;
    const currencyCode = normalizeCcy(codeRaw || "");

    if (!currencyCode) {
      return NextResponse.json({ error: "Invalid currencyCode (ISO 4217 AAA expected)" }, { status: 400 });
    }
    if (!id && !key) {
      return NextResponse.json({ error: "Provide destination id or key" }, { status: 400 });
    }

    // 1) найти запись
    const where = id ? { id } : { key: String(key) };
    const dest = await prisma.destination.findFirst({ where });
    if (!dest) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    // 2) получить курс
    const rateEntry = await getRateToKzt(currencyCode);
    if (!rateEntry) {
      return NextResponse.json({ error: "Rate fetch failed" }, { status: 503 });
    }

    // 3) обновить basics (JSON)
    const basics = (dest.basics as any) || {};
    basics.currencyCode = currencyCode;
    basics.currencyPerKZT = rateEntry.value; // совместимость со старым рендером

    // 4) апдейт БД
    const updated = await prisma.destination.update({
      where: { id: dest.id },
      data: {
        basics,
        currencyCode: currencyCode,
        currencyBase: "KZT",
        currencyRateToKzt: rateEntry.value,
        currencyProvider: rateEntry.provider,
        currencyUpdatedAt: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      id: updated.id,
      currency: {
        code: currencyCode,
        base: "KZT",
        rate: rateEntry.value,
        provider: rateEntry.provider,
        updatedAt: Date.now(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}