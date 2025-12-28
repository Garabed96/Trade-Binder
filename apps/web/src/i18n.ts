import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '../public/locales/en/common.json';
import enHome from '../public/locales/en/home.json';
import thCommon from '../public/locales/th/common.json';
import thHome from '../public/locales/th/home.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
  },
  th: {
    common: thCommon,
    home: thHome,
  },
};

i18next.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'home'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false, // Important for Next.js
  },
});

export default i18next;
