import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import es from './locales/es';
import fr from './locales/fr';
import th from './locales/th';

export const translations = {
  en,
  zh,
  ja,
  es,
  fr,
  th,
};

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
] as const;

export type Language = typeof languages[number]['code'];
export type Translation = typeof en;

export function getTranslation(lang: Language): Translation {
  return translations[lang] as Translation || translations.en as Translation;
}
