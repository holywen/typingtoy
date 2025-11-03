'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translation, getTranslation } from './index';
import { getUserSettings, updateSetting } from '../services/userSettings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [t, setTranslation] = useState<Translation>(getTranslation('en'));

  useEffect(() => {
    // Load language from settings
    const settings = getUserSettings();
    const savedLanguage = settings.language || 'en';
    setLanguageState(savedLanguage as Language);
    setTranslation(getTranslation(savedLanguage as Language));
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setTranslation(getTranslation(lang));
    updateSetting('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
