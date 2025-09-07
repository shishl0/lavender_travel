export type Locale = "ru" | "kk" | "en";

/** Локализуемая строка (в т.ч. HTML из редактора) */
export type Localized = Record<Locale, string | null>;
/** Локализуемый список строк (например, города) */
export type LocalizedList = Record<Locale, (string[] | null)>;

export type SiteSettingsDTO = {
  id: string;
  isActive: boolean;

  // ===== Бренд / контакты =====
  brand?: string | null;           // brandName
  tagline?: string | null;         // brandTagline
  phoneNumber?: string | null;     // НОВОЕ
  whatsappNumber?: string | null;
  instagramUrl?: string | null;

  // ===== SEO / OG =====
  title?: string | null;           // metaTitle
  description?: string | null;     // metaDescription
  ogImageUrl?: string | null;

  // ===== Статы / опыт =====
  statsMode?: "hidden" | "auto" | "shown" | string | null;
  statsClients?: number | null;
  statsRating?: number | null;
  inTourismSinceISO?: string | null;

  // ===== Адрес / документы =====
  address?: Localized | null;
  certificateUrl?: string | null;
  mapEmbedUrl?: string | null;     // НОВОЕ

  // ===== Политики (rich HTML) =====
  privacyPolicy?: Localized | null;
  termsOfService?: Localized | null;

  // ===== Политики (DOCX ссылки) =====
  privacyPolicyDocUrls?: Partial<Record<Locale, string>> | null;   // НОВОЕ
  termsOfServiceDocUrls?: Partial<Record<Locale, string>> | null;  // НОВОЕ
};

export type HeroDTO = {
  id: string;
  isActive: boolean;
  variant?: string | null;

  kicker: Localized | null;
  titleTop: Localized | null;
  titleBottom: Localized | null;
  subtitle: Localized | null;

  imageUrl: string | null;
  imageAlt: Localized | null;
};

/* ===== Базовая инфа, климат и POI ===== */

export type CountryBasics = {
  timezones?: string[] | null;       // e.g. ["Asia/Dubai"]
  capital?: Localized | null;        // локализуемое имя столицы
  languages?: LocalizedList | null;  // локализуемые списки языков
  currencyCode?: string | null;      // "AED", "TRY" и т.п.
  currencyPerKZT?: number | null;    // курс: 1 валюта ≈ X KZT
};

export type ClimatePoint = {
  year: number;
  month: number;      // 1..12
  airC?: number | null;
  waterC?: number | null;
  humidity?: number | null;  // %
  uvIndex?: number | null;   // индекс UV
  source?: string | null;
};

export type POICard = {
  title: Localized;
  imageUrl?: string | null;
  blurb?: Localized | null;
};

export type DestinationDTO = {
  id: string;
  key: string;
  title: Localized;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;

  cities?: LocalizedList | null;
  priceFrom?: number | null;
  allowMinPrice: boolean;
  showOnHome: boolean;

  descriptionHtml?: Localized | null;
  highlights?: LocalizedList | null;
  facts?: LocalizedList | null;
  gallery?: string[] | null;
  visaInfo?: Localized | null;
  safety?: Localized | null;
  bestSeasons?: string[] | null;
  mapEmbedUrl?: string | null;

  heroImages?: string[] | null;
  basics?: CountryBasics | null;
  poi?: POICard[] | null;
  faqVisa?: Localized | null;
  faqEntry?: Localized | null;
  faqReturn?: Localized | null;

  climate?: ClimatePoint[] | null;
  climateBlended?: ClimatePoint[] | null;
};