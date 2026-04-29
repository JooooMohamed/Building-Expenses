import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import ar from './ar.json';
import en from './en.json';

// Force Arabic + RTL for v1 — Egyptian building managers
const LANGUAGE = 'ar';

I18nManager.forceRTL(true);

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: LANGUAGE,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
