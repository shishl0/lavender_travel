// types/cms.ts
export type Locale = "ru" | "kk" | "en";

/** Локализуемая строка (в т.ч. HTML из редактора) */
export type Localized = Record<Locale, string | null>;
/** Локализуемый список строк (например, города) */
export type LocalizedList = Record<Locale, (string[] | null)>;

export type SiteSettingsDTO = {
  id: string;
  // ===== Бренд / контакты =====
  brand?: string | null;
  tagline?: string | null;
  whatsappNumber?: string | null;
  instagramUrl?: string | null;

  // ===== SEO / OG =====
  title?: string | null;        // metaTitle
  description?: string | null;  // metaDescription
  ogImageUrl?: string | null;

  isActive: boolean;

  // ===== UX =====
  departureOptions?: string[] | null; // Алматы/Астана и т.п.

  // ===== Статы / опыт =====
  statsMode?: "hidden" | "auto" | "shown";
  statsAutoAtISO?: string | null;     // когда авто-включать блок
  statsClients?: number | null;       // кол-во клиентов
  statsRating?: number | null;        // ср.оценка /5
  inTourismSinceISO?: string | null;  // “в туризме с …” (дата) — фронт сам считает мес/годы

  // ===== Адрес / документы =====
  address?: Localized | null;         // адрес (локализуемый)
  certificateUrl?: string | null;     // PDF сертификат

  // ===== Политики (rich text, храним HTML-строки по языкам) =====
  privacyPolicy?: Localized | null;   // HTML
  termsOfService?: Localized | null;  // HTML

  // ===== Минимальные цены (глобальные флаги) =====
  pricingMinPriceEnabled?: boolean;   // галка “показывать минималку”
  pricingMinPriceFormula?: string | null; // строка-формула/DSL (заглушка до алгоритма)
  pricingMatrixUrl?: string | null;   // источник матрицы (позже подключим)
};

export type HeroDTO = {
  id: string;
  isActive: boolean;
  variant?: string | null;

  kicker: Localized | null;
  titleTop: Localized | null;
  titleBottom: Localized | null;
  subtitle: Localized | null;

  // ⛔️ CTA больше не из CMS — берём из i18n
  // ctaPrimary: Localized | null;
  // ctaSecondary: Localized | null;

  imageUrl: string | null;
  imageAlt: Localized | null;
};

export type DestinationDTO = {
  id: string;
  key: string;
  title: Localized;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;

  cities?: LocalizedList | null;  // города по языкам
  priceFrom?: number | null;      // опц. ручной “от … ₸” (до матрицы)
  allowMinPrice: boolean;         // можно ли показывать минималку для этого направления
  showOnHome: boolean;            // выводить в тизере на главной
};