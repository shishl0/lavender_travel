import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { DestinationDTO, HeroDTO, Localized, LocalizedList, SiteSettingsDTO } from '@/types/cms';
import fs from 'fs/promises';
import path from 'path';

const TAG_ALL = 'cms';
const TAG_SETTINGS = 'cms:settings';
const TAG_HERO = 'cms:hero';
const TAG_DESTS = 'cms:destinations';

const SNAPSHOT_PATH = path.join(process.cwd(), 'public', 'cms-snapshot.json');

type SnapshotShape = {
  settings: SiteSettingsDTO | null;
  hero: HeroDTO | null;
  destinations: DestinationDTO[];
} | null;

/* ---------- helpers ---------- */
async function readSnapshot(): Promise<SnapshotShape> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw) as SnapshotShape;
  } catch {
    return null;
  }
}

function asLocalized(v: unknown): Localized | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const ru = typeof o.ru === 'string' ? o.ru : null;
  const kk = typeof o.kk === 'string' ? o.kk : null;
  const en = typeof o.en === 'string' ? o.en : null;
  if (ru == null && kk == null && en == null) return null;
  return { ru, kk, en };
}

function asLocalizedList(v: unknown): LocalizedList | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const norm = (arr: unknown): string[] | null =>
    Array.isArray(arr) ? arr.map(x => (typeof x === 'string' ? x : '')).filter(Boolean) : null;

  const ru = norm(o.ru);
  const kk = norm(o.kk);
  const en = norm(o.en);
  if (ru == null && kk == null && en == null) return null;
  return { ru, kk, en };
}

/* ---------- mappers ---------- */
function mapSettings(row: any | null): SiteSettingsDTO | null {
  if (!row) return null;

  // даты → ISO
  const toISO = (d: any): string | null => (d instanceof Date ? d.toISOString() : (typeof d === 'string' ? new Date(d).toISOString() : null));

  return {
    id: row.id,
    isActive: !!row.isActive,

    // бренд / контакты
    brand: row.brandName ?? 'Lavender Travel KZ',
    tagline: row.brandTagline ?? null,
    whatsappNumber: row.whatsappNumber ?? null,
    instagramUrl: row.instagramUrl ?? null,

    // SEO / OG (в твоих типах: title/description)
    title: row.metaTitle ?? '',
    description: row.metaDescription ?? '',
    ogImageUrl: row.ogImageUrl ?? null,

    // UX (опционально, если у тебя такое поле есть — иначе оставим undefined)
    departureOptions: undefined,

    // статы / опыт
    statsMode: row.statsMode ?? undefined,
    statsAutoAtISO: toISO(row.statsAutoAt),
    statsClients: (typeof row.statsClients === 'number') ? row.statsClients : null,
    statsRating: (typeof row.statsRating === 'number') ? row.statsRating : null,
    inTourismSinceISO: toISO(row.inTourismSince),

    // адрес / документы
    address: asLocalized(row.address) ?? null,
    certificateUrl: row.certificateUrl ?? null,

    // политики (как HTML-строки по языкам — если у тебя editor отдаёт строки)
    privacyPolicy: asLocalized(row.privacyPolicy) ?? null,
    termsOfService: asLocalized(row.termsOfService) ?? null,

    // минимальные цены (глобально)
    pricingMinPriceEnabled: !!row.pricingMinPriceEnabled,
    pricingMinPriceFormula: row.pricingMinPriceFormula ?? null,
    pricingMatrixUrl: row.pricingMatrixUrl ?? null,
  };
}

function mapHero(row: any | null): HeroDTO | null {
  if (!row) return null;
  return {
    id: row.id,
    isActive: !!row.isActive,
    variant: row.variant ?? 'DEFAULT',

    kicker: asLocalized(row.kicker),
    titleTop: asLocalized(row.titleTop),
    titleBottom: asLocalized(row.titleBottom),
    subtitle: asLocalized(row.subtitle),

    // CTA удалены из модели/DTO
    imageUrl: row.imageUrl ?? null,
    imageAlt: asLocalized(row.imageAlt),
  };
}

function mapDestination(row: any): DestinationDTO {
  return {
    id: row.id,
    key: row.key,
    title: (asLocalized(row.title) ?? { ru: row.key, kk: row.key, en: row.key }) as Localized,
    imageUrl: row.imageUrl ?? null,
    sortOrder: Number(row.sortOrder) || 0,
    isActive: !!row.isActive,

    // NEW
    cities: asLocalizedList(row.cities),
    priceFrom: (typeof row.priceFrom === 'number') ? row.priceFrom : null,
    allowMinPrice: !!row.allowMinPrice,
    showOnHome: !!row.showOnHome,
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
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
    });
    if (rows?.length) return rows.map(mapDestination);
    const snapshot = await readSnapshot();
    return snapshot?.destinations ?? [];
  } catch {
    const snapshot = await readSnapshot();
    return snapshot?.destinations ?? [];
  }
}

/* ---------- cached exports ---------- */
export const getActiveSettings = unstable_cache(
  async () => fetchActiveSettings(),
  [TAG_SETTINGS],
  { tags: [TAG_ALL, TAG_SETTINGS], revalidate: 3600 }
);

export const getActiveHero = unstable_cache(
  async () => fetchActiveHero(),
  [TAG_HERO],
  { tags: [TAG_ALL, TAG_HERO], revalidate: 3600 }
);

export const getActiveDestinations = unstable_cache(
  async () => fetchActiveDestinations(),
  [TAG_DESTS],
  { tags: [TAG_ALL, TAG_DESTS], revalidate: 3600 }
);

export function invalidateCmsAll() { revalidateTag(TAG_ALL); }
export function invalidateSettings() { revalidateTag(TAG_SETTINGS); }
export function invalidateHero() { revalidateTag(TAG_HERO); }
export function invalidateDestinations() { revalidateTag(TAG_DESTS); }

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
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snap, null, 2), 'utf8');
}