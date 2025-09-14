// src/lib/cms-cache.ts
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  DestinationDTO,
  HeroDTO,
  Localized,
  LocalizedList,
  SiteSettingsDTO,
  CountryBasics,
  POICard,
  ClimatePoint,
} from "@/types/cms";
import fs from "fs/promises";
import path from "path";

/* ---------- tags ---------- */
const TAG_ALL = "cms";
const TAG_SETTINGS = "cms:settings";
const TAG_HERO = "cms:hero";
const TAG_DESTS = "cms:destinations";

/* ---------- snapshot path ---------- */
const SNAPSHOT_PATH = path.join(process.cwd(), "public", "cms-snapshot.json");

type SnapshotShape = {
  settings: SiteSettingsDTO | null;
  hero: HeroDTO | null;
  destinations: DestinationDTO[];
} | null;

/* ---------- helpers ---------- */
async function readSnapshot(): Promise<SnapshotShape> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as SnapshotShape;
  } catch {
    return null;
  }
}

function asLocalized(v: unknown): Localized | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ru = typeof o.ru === "string" ? o.ru : null;
  const kk = typeof o.kk === "string" ? o.kk : null;
  const en = typeof o.en === "string" ? o.en : null;
  if (ru == null && kk == null && en == null) return null;
  return { ru, kk, en };
}

function asLocalizedList(v: unknown): LocalizedList | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const norm = (arr: unknown): string[] | null =>
    Array.isArray(arr)
      ? arr.map((x) => (typeof x === "string" ? x : "")).filter(Boolean)
      : null;

  const ru = norm(o.ru);
  const kk = norm(o.kk);
  const en = norm(o.en);
  if (ru == null && kk == null && en == null) return null;
  return { ru, kk, en };
}

const toISO = (d: any): string | null =>
  d instanceof Date
    ? d.toISOString()
    : typeof d === "string"
      ? new Date(d).toISOString()
      : null;

/* --- NEW: basics & poi parsers --- */
function asBasics(v: unknown): CountryBasics | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const timezones = Array.isArray(o.timezones)
    ? o.timezones.map(String).filter(Boolean)
    : null;
  const capital = asLocalized(o.capital ?? null);
  const languages = asLocalizedList(o.languages ?? null);
  const currencyCode = typeof o.currencyCode === "string" ? o.currencyCode : null;
  const currencyPerKZT =
    typeof o.currencyPerKZT === "number"
      ? o.currencyPerKZT
      : Number.isFinite(Number(o.currencyPerKZT))
        ? Number(o.currencyPerKZT)
        : null;

  if (!timezones && !capital && !languages && !currencyCode && currencyPerKZT == null) {
    return null;
  }
  return { timezones, capital, languages, currencyCode, currencyPerKZT };
}

function asPOI(v: unknown): POICard[] | null {
  if (!Array.isArray(v)) return null;
  const list: POICard[] = [];
  for (const it of v) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const title = asLocalized(o.title ?? null);
    if (!title) continue;
    list.push({
      title,
      imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : null,
      blurb: asLocalized(o.blurb ?? null),
    });
  }
  return list.length ? list : null;
}

/* --- climate helpers --- */
function mapClimateFromMonths(months: any): ClimatePoint[] | null {
  if (!months || typeof months !== "object") return null;
  const obj = months as Record<string, any>;
  const yearUsing = Number(obj.yearUsing) || new Date().getFullYear();

  const airArr: any[] = Array.isArray(obj.airC) ? obj.airC : [];
  const waterArr: any[] = Array.isArray(obj.waterC) ? obj.waterC : [];
  const humidityArr: any[] = Array.isArray(obj.humidity) ? obj.humidity : [];
  const uvArr: any[] = Array.isArray(obj.uvIndex) ? obj.uvIndex : [];

  const out: ClimatePoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const i = m - 1;
    out.push({
      year: yearUsing,
      month: m,
      airC: typeof airArr[i] === "number" ? airArr[i] : null,
      waterC: typeof waterArr[i] === "number" ? waterArr[i] : null,
      humidity: typeof humidityArr[i] === "number" ? humidityArr[i] : null,
      uvIndex: typeof uvArr[i] === "number" ? uvArr[i] : null,
      source: typeof obj.source === "string" ? obj.source : (obj.meta?.source ?? null),
    });
  }
  return out;
}

function blendClimate(points: ClimatePoint[] | null): ClimatePoint[] | null {
  if (!points?.length) return null;
  return points;
}

/* ---------- mappers ---------- */
function mapSettings(row: any | null): SiteSettingsDTO | null {
  if (!row) return null;

  // DOCX урлы могут храниться как Json или null
  const asDocx = (v: unknown): Partial<Record<"ru" | "kk" | "en", string>> | null => {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const pick = (k: "ru" | "kk" | "en") => (typeof o[k] === "string" ? (o[k] as string) : undefined);
    const ru = pick("ru");
    const kk = pick("kk");
    const en = pick("en");
    const any = ru || kk || en;
    return any ? { ru, kk, en } : null;
  };

  return {
    id: row.id,
    isActive: !!row.isActive,

    // бренд / контакты
    brand: row.brandName ?? "Lavender Travel KZ",
    tagline: row.brandTagline ?? null,
    phoneNumber: row.phoneNumber ?? null,
    whatsappNumber: row.whatsappNumber ?? null,
    instagramUrl: row.instagramUrl ?? null,

    // SEO / OG
    title: row.metaTitle ?? "",
    description: row.metaDescription ?? "",
    ogImageUrl: row.ogImageUrl ?? null,

    // статы / опыт
    statsMode: row.statsMode ?? null,
    statsClients: typeof row.statsClients === "number" ? row.statsClients : null,
    statsRating: typeof row.statsRating === "number" ? row.statsRating : null,
    inTourismSinceISO: toISO(row.inTourismSince),

    // адрес / документы
    address: asLocalized(row.address) ?? null,
    certificateUrl: row.certificateUrl ?? null,
    mapEmbedUrl: row.mapEmbedUrl ?? null,

    // политики (HTML)
    privacyPolicy: asLocalized(row.privacyPolicy) ?? null,
    termsOfService: asLocalized(row.termsOfService) ?? null,

    // политики (DOCX)
    privacyPolicyDocUrls: asDocx(row.privacyPolicyDocUrls),
    termsOfServiceDocUrls: asDocx(row.termsOfServiceDocUrls),
  };
}

function mapHero(row: any | null): HeroDTO | null {
  if (!row) return null;
  return {
    id: row.id,
    isActive: !!row.isActive,
    variant: row.variant ?? "DEFAULT",

    kicker: asLocalized(row.kicker),
    titleTop: asLocalized(row.titleTop),
    titleBottom: asLocalized(row.titleBottom),
    subtitle: asLocalized(row.subtitle),

    imageUrl: row.imageUrl ?? null,
    imageAlt: asLocalized(row.imageAlt),
  };
}

function mapDestination(row: any): DestinationDTO {
  return {
    id: row.id,
    key: row.key,
    title:
      (asLocalized(row.title) ?? {
        ru: row.key,
        kk: row.key,
        en: row.key,
      }) as Localized,
    imageUrl: row.imageUrl ?? null,
    sortOrder: Number(row.sortOrder) || 0,
    isActive: !!row.isActive,

    cities: asLocalizedList(row.cities),
    priceFrom:
      typeof row.priceFrom === "number"
        ? row.priceFrom
        : Number.isFinite(Number(row.priceFrom))
          ? Number(row.priceFrom)
          : null,
    allowMinPrice: !!row.allowMinPrice,
    showOnHome: !!row.showOnHome,

    descriptionHtml: asLocalized(row.descriptionHtml),
    highlights: asLocalizedList(row.highlights),
    facts: asLocalizedList(row.facts),
    gallery: Array.isArray(row.gallery)
      ? row.gallery.filter((s: any) => typeof s === "string" && s)
      : null,
    visaInfo: asLocalized(row.visaInfo),
    safety: asLocalized(row.safety),
    bestSeasons: Array.isArray(row.bestSeasons)
      ? row.bestSeasons.filter((s: any) => typeof s === "string" && s)
      : null,
    mapEmbedUrl: typeof row.mapEmbedUrl === "string" ? row.mapEmbedUrl : null,

    heroImages: Array.isArray(row.heroImages)
      ? row.heroImages.filter((s: any) => typeof s === "string" && s)
      : null,
    basics: asBasics(row.basics),
    poi: asPOI(row.poi),
    faqVisa: asLocalized(row.faqVisa),
    faqEntry: asLocalized(row.faqEntry),
    faqReturn: asLocalized(row.faqReturn),

    climate: null,
    climateBlended: null,
  };
}

/* ---------- fetchers with snapshot fallback ---------- */
async function fetchActiveSettings(): Promise<SiteSettingsDTO | null> {
  try {
    const row = await prisma.siteSettings.findFirst({ where: { isActive: true } });
    const dto = mapSettings(row);
    if (dto) return dto;

    const snapshot = await readSnapshot();
    return snapshot?.settings ?? null;
  } catch {
    const snapshot = await readSnapshot();
    return snapshot?.settings ?? null;
  }
}

async function fetchActiveHero(): Promise<HeroDTO | null> {
  try {
    const row = await prisma.hero.findFirst({ where: { isActive: true } });
    const dto = mapHero(row);
    if (dto) return dto;

    const snapshot = await readSnapshot();
    return snapshot?.hero ?? null;
  } catch {
    const snapshot = await readSnapshot();
    return snapshot?.hero ?? null;
  }
}

async function fetchActiveDestinations(): Promise<DestinationDTO[]> {
  try {
    const rows = await prisma.destination.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
    });
    if (rows?.length) return rows.map(mapDestination);

    const snapshot = await readSnapshot();
    return (snapshot?.destinations ?? [])
      .filter((d) => d.isActive && d.showOnHome)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    const snapshot = await readSnapshot();
    return (snapshot?.destinations ?? [])
      .filter((d) => d.isActive && d.showOnHome)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

/** Детальная страна */
async function fetchDestinationByKeyRaw(key: string): Promise<DestinationDTO | null> {
  try {
    const row = await prisma.destination.findUnique({ where: { key } });
    if (row) {
      const dto = mapDestination(row);

      let climatePoints: ClimatePoint[] | null = null;
      try {
        const cl = await prisma.destinationClimate.findUnique({
          where: { destinationId: row.id },
        });
        climatePoints = cl ? mapClimateFromMonths(cl.months as any) : null;
      } catch {
        climatePoints = null;
      }

      return {
        ...dto,
        climate: climatePoints,
        climateBlended: blendClimate(climatePoints),
      };
    }

    const snapshot = await readSnapshot();
    return (snapshot?.destinations ?? []).find((d) => d.key === key) ?? null;
  } catch {
    const snapshot = await readSnapshot();
    return (snapshot?.destinations ?? []).find((d) => d.key === key) ?? null;
  }
}

/* ---------- cached exports ---------- */
export const getActiveSettings = unstable_cache(
  async () => fetchActiveSettings(),
  [TAG_SETTINGS],
  { tags: [TAG_ALL, TAG_SETTINGS], revalidate: 3600 },
);

export const getActiveHero = unstable_cache(
  async () => fetchActiveHero(),
  [TAG_HERO],
  { tags: [TAG_ALL, TAG_HERO], revalidate: 3600 },
);

export const getActiveDestinations = unstable_cache(
  async () => fetchActiveDestinations(),
  [TAG_DESTS],
  { tags: [TAG_ALL, TAG_DESTS], revalidate: 3600 },
);

export function getDestinationByKey(key: string) {
  const cached = unstable_cache(
    async () => fetchDestinationByKeyRaw(key),
    [`${TAG_DESTS}:byKey:${key}`],
    { tags: [TAG_ALL, TAG_DESTS], revalidate: 1800 }
  );
  return cached();
}

/* ---------- invalidators ---------- */
export function invalidateCmsAll() {
  revalidateTag(TAG_ALL);
}
export function invalidateSettings() {
  revalidateTag(TAG_SETTINGS);
}
export function invalidateHero() {
  revalidateTag(TAG_HERO);
}
export function invalidateDestinations() {
  revalidateTag(TAG_DESTS);
}

/* ---------- snapshot build/write ---------- */
export async function buildSnapshot(): Promise<SnapshotShape> {
  const [settings, hero, destinations] = await Promise.all([
    fetchActiveSettings(),
    fetchActiveHero(),
    fetchActiveDestinations(),
  ]);
  return { settings, hero, destinations };
}

export async function writeSnapshot() {
  const snap = await buildSnapshot();
  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snap, null, 2), "utf8");
}