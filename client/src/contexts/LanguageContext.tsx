import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getLanguageByCode, getBrowserLanguage, getStoredLanguage, setStoredLanguage, isRTLLanguage } from '@shared/languages';
import { apiRequest } from '@/lib/queryClient';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (languageCode: string) => void;
  translate: (text: string, context?: string) => Promise<string>;
  translateBulk: (texts: string[], context?: string) => Promise<string[]>;
  detectLanguage: (text: string) => Promise<{ language: string; confidence: number }>;
  isRTL: boolean;
  isLoading: boolean;
  error: string | null;
  supportedLanguages: Language[];
  revision: number; // Force re-renders when language changes
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    getLanguageByCode(DEFAULT_LANGUAGE) || SUPPORTED_LANGUAGES[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  // Country-to-language mapping for intelligent language detection
  const getLanguageByCountry = (countryCode: string): string | null => {
    const countryLanguageMap: Record<string, string> = {
      'US': 'en', 'CA': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es',
      'FR': 'fr', 'CH': 'fr', 'LU': 'fr', 'MC': 'fr',
      'DE': 'de', 'AT': 'de', 'LI': 'de',
      'IT': 'it', 'SM': 'it', 'VA': 'it',
      'PT': 'pt', 'BR': 'pt',
      'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',
      'CN': 'zh', 'TW': 'zh', 'HK': 'zh', 'SG': 'zh',
      'JP': 'ja',
      'KR': 'ko',
      'IN': 'hi', 'PK': 'ur', 'BD': 'bn',
      'SA': 'ar', 'EG': 'ar', 'AE': 'ar', 'MA': 'ar', 'DZ': 'ar',
      'TR': 'tr',
      'NL': 'nl', 'BE': 'nl',
      'PL': 'pl', 'CZ': 'cs', 'SK': 'sk',
      'HU': 'hu', 'RO': 'ro', 'BG': 'bg',
      'GR': 'el', 'HR': 'hr', 'RS': 'sr',
      'FI': 'fi', 'SE': 'sv', 'NO': 'no', 'DK': 'da',
      'IL': 'he', 'TH': 'th', 'VN': 'vi',
      'ID': 'id', 'MY': 'ms', 'PH': 'tl'
    };
    return countryLanguageMap[countryCode] || null;
  };

  // Detect country using multiple methods
  const detectUserCountry = async (): Promise<string | null> => {
    try {
      // Try timezone-based detection first
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneCountryMap: Record<string, string> = {
        'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
        'America/Toronto': 'CA', 'America/Vancouver': 'CA',
        'Europe/London': 'GB', 'Europe/Dublin': 'IE',
        'Europe/Paris': 'FR', 'Europe/Brussels': 'BE',
        'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
        'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
        'Europe/Amsterdam': 'NL', 'Europe/Stockholm': 'SE',
        'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN',
        'Asia/Kolkata': 'IN', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA',
        'Australia/Sydney': 'AU', 'Pacific/Auckland': 'NZ'
      };

      if (timezone && timezoneCountryMap[timezone]) {
        return timezoneCountryMap[timezone];
      }

      // Try geolocation API as fallback
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return data.country_code || null;
      }

      return null;
    } catch (error) {
      console.warn('Country detection failed:', error);
      return null;
    }
  };

  // Get user's saved language preference
  const getUserLanguagePreference = async (): Promise<string | null> => {
    try {
      const response = await apiRequest('GET', '/api/user/language-preference');
      return response.language || null;
    } catch (error) {
      console.warn('Could not fetch user language preference:', error);
      return null;
    }
  };

  // Save user's language preference
  const saveUserLanguagePreference = async (languageCode: string): Promise<void> => {
    try {
      await apiRequest('POST', '/api/user/language-preference', { language: languageCode });
    } catch (error) {
      console.warn('Could not save user language preference:', error);
    }
  };

  // Initialize language on mount with intelligent detection
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      try {
        // Priority 1: User's saved preference in profile
        const userPreference = await getUserLanguagePreference();
        if (userPreference) {
          const language = getLanguageByCode(userPreference);
          if (language) {
            setCurrentLanguage(language);
            setStoredLanguage(userPreference);
            setIsLoading(false);
            return;
          }
        }

        // Priority 2: Stored language in localStorage
        const storedLang = getStoredLanguage();
        if (storedLang && storedLang !== DEFAULT_LANGUAGE) {
          const language = getLanguageByCode(storedLang);
          if (language) {
            setCurrentLanguage(language);
            setIsLoading(false);
            return;
          }
        }

        // Priority 3: Country-based language detection
        const userCountry = await detectUserCountry();
        if (userCountry) {
          const countryLanguage = getLanguageByCountry(userCountry);
          if (countryLanguage) {
            const language = getLanguageByCode(countryLanguage);
            if (language) {
              setCurrentLanguage(language);
              setStoredLanguage(countryLanguage);
              setIsLoading(false);
              return;
            }
          }
        }

        // Priority 4: Browser language detection
        const browserLang = getBrowserLanguage();
        if (browserLang) {
          const language = getLanguageByCode(browserLang);
          if (language) {
            setCurrentLanguage(language);
            setStoredLanguage(browserLang);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: Default language
        const defaultLanguage = getLanguageByCode(DEFAULT_LANGUAGE) || SUPPORTED_LANGUAGES[0];
        setCurrentLanguage(defaultLanguage);
        setIsLoading(false);

      } catch (error) {
        console.error('Language initialization error:', error);
        const defaultLanguage = getLanguageByCode(DEFAULT_LANGUAGE) || SUPPORTED_LANGUAGES[0];
        setCurrentLanguage(defaultLanguage);
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const setLanguage = async (languageCode: string) => {
    const language = getLanguageByCode(languageCode);
    if (language) {
      setCurrentLanguage(language);
      setStoredLanguage(languageCode);
      setRevision(prev => prev + 1); // Force re-renders
      
      // Save user preference to backend
      await saveUserLanguagePreference(languageCode);
      
      // Apply RTL class to document
      if (isRTLLanguage(languageCode)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.classList.remove('rtl');
      }
      
      // Update the HTML lang attribute
      document.documentElement.lang = languageCode;
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    }
  };

  // Apply RTL styling when language changes
  useEffect(() => {
    if (isRTLLanguage(currentLanguage.code)) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.classList.remove('rtl');
    }
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage]);

  const translate = async (text: string, context?: string): Promise<string> => {
    if (currentLanguage.code === DEFAULT_LANGUAGE || !text.trim()) {
      return text;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/translation/translate', {
        text,
        targetLanguage: currentLanguage.code,
        sourceLanguage: DEFAULT_LANGUAGE,
        context,
        preserveFormatting: true
      });

      setIsLoading(false);
      return response.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation failed');
      setIsLoading(false);
      return text; // Return original text on error
    }
  };

  const translateBulk = async (texts: string[], context?: string): Promise<string[]> => {
    if (currentLanguage.code === DEFAULT_LANGUAGE || texts.length === 0) {
      return texts;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/translation/translate-bulk', {
        texts,
        targetLanguage: currentLanguage.code,
        sourceLanguage: DEFAULT_LANGUAGE,
        context
      });

      setIsLoading(false);
      return response.translations?.map((t: any) => t.translatedText) || texts;
    } catch (error) {
      console.error('Bulk translation error:', error);
      setError('Bulk translation failed');
      setIsLoading(false);
      return texts; // Return original texts on error
    }
  };

  const detectLanguage = async (text: string): Promise<{ language: string; confidence: number }> => {
    if (!text.trim()) {
      return { language: DEFAULT_LANGUAGE, confidence: 0.5 };
    }

    try {
      const response = await apiRequest('POST', '/api/translation/detect', { text });
      return {
        language: response.detectedLanguage || DEFAULT_LANGUAGE,
        confidence: response.confidence || 0.5
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return { language: DEFAULT_LANGUAGE, confidence: 0.5 };
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translate,
    translateBulk,
    detectLanguage,
    isRTL: isRTLLanguage(currentLanguage.code),
    isLoading,
    error,
    supportedLanguages: SUPPORTED_LANGUAGES,
    revision
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;