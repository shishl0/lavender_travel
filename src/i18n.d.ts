import "i18next";
import type { TranslationTypes } from "@/i18n/translations/TranslationTypes";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: TranslationTypes;
  }
}