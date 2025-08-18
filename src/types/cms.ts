export type Locale = "ru" | "kk" | "en";
export type Localized = Record<Locale, string | null>;

export type SiteSettingsDTO = {
  id: string;
  brand?: string | null;
  tagline?: string | null;
  whatsappNumber?: string | null;
  instagramUrl?: string | null;
  title?: string | null;
  description?: string | null;
  ogImageUrl?: string | null;
  isActive: boolean;
  departureOptions?: string[] | null;
};

export type HeroDTO = {
  id: string;
  kicker: Localized | null;
  titleTop: Localized | null;
  titleBottom: Localized | null;
  subtitle: Localized | null;
  ctaPrimary: Localized | null;
  ctaSecondary: Localized | null;
  imageUrl: string | null;
  imageAlt: Localized | null;
  isActive: boolean;
  variant?: string | null; 
};

export type DestinationDTO = {
  id: string;
  key: string;
  title: Localized;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};