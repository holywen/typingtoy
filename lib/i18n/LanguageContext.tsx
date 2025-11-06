'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Language, Translation, getTranslation } from './index';
import { getUserSettings, updateSetting } from '../services/userSettings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [language, setLanguageState] = useState<Language>('en');
  const [t, setTranslation] = useState<Translation>(getTranslation('en'));
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      // Wait for session to load
      if (status === 'loading') {
        return;
      }

      let savedLanguage: string | null = null;

      // Try to load from database if authenticated
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/settings');
          if (response.ok) {
            const data = await response.json();
            savedLanguage = data.settings?.language;
          }
        } catch (error) {
          console.error('Failed to load language from database:', error);
        }
      }

      // Fallback to localStorage if database fetch failed or user not authenticated
      if (!savedLanguage) {
        const settings = getUserSettings();
        savedLanguage = settings.language || 'en';
      }

      setLanguageState(savedLanguage as Language);
      setTranslation(getTranslation(savedLanguage as Language));
      setIsInitialized(true);
    }

    loadLanguage();
  }, [session, status]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setTranslation(getTranslation(lang));

    // Always save to localStorage
    updateSetting('language', lang);

    // Also save to database if authenticated
    if (status === 'authenticated' && session?.user) {
      try {
        await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: { language: lang },
          }),
        });
      } catch (error) {
        console.error('Failed to save language to database:', error);
      }
    }
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
