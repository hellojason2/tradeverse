import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import zhCommon from './locales/zh/common.json';
import enDashboard from './locales/en/dashboard.json';
import zhDashboard from './locales/zh/dashboard.json';
import enAuth from './locales/en/auth.json';
import zhAuth from './locales/zh/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, dashboard: enDashboard, auth: enAuth },
      zh: { common: zhCommon, dashboard: zhDashboard, auth: zhAuth },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "dashboard", "auth"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "tv-lang",
    },
  });

export default i18n;
