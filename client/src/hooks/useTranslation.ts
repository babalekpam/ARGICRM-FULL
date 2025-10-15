import { useState, useEffect } from 'react';
import { i18n } from '@/services/i18n';

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      setCurrentLanguage(language);
    };

    i18n.addLanguageChangeListener(handleLanguageChange);

    return () => {
      i18n.removeLanguageChangeListener(handleLanguageChange);
    };
  }, []);

  const t = (key: string, params?: Record<string, string | number>) => {
    return i18n.translate(key, params);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return i18n.formatNumber(number, options);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return i18n.formatCurrency(amount, currency);
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return i18n.formatDate(date, options);
  };

  const formatRelativeTime = (date: Date) => {
    return i18n.formatRelativeTime(date);
  };

  const changeLanguage = (languageCode: string) => {
    i18n.setLanguage(languageCode);
  };

  const getAvailableLanguages = () => {
    return i18n.getAvailableLanguages();
  };

  const getCurrentLanguageConfig = () => {
    return i18n.getCurrentLanguageConfig();
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    getAvailableLanguages,
    getCurrentLanguageConfig,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime
  };
}