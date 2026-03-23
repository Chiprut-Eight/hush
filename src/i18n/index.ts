import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import he from './he.json';

const savedLang = localStorage.getItem('hush-language') || 'he';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: 'en' | 'he') {
  i18n.changeLanguage(lang);
  localStorage.setItem('hush-language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

// Set initial direction
document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'he' ? 'rtl' : 'ltr';

export default i18n;
