import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './translations/en_translation.json';
import ru from './translations/ru_translation.json';
import kk from './translations/kk_translation.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  kk: { translation: kk },
} as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: 'ru',
      fallbackLng: 'ru',
      supportedLngs: ['ru', 'kk', 'en'],
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      interpolation: { escapeValue: false },
      returnEmptyString: false,
      initImmediate: false,
      react: { useSuspense: false },
    });
}

export default i18n;