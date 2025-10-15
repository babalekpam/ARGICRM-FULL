import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook that automatically translates text and re-renders when language changes
 */
export function useAutoTranslation(text: string, context?: string) {
  const { currentLanguage, translate, revision } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const performTranslation = async () => {
      if (!text.trim()) {
        setTranslatedText(text);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translate(text, context);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsTranslating(false);
      }
    };

    performTranslation();
  }, [text, currentLanguage.code, translate, context, revision]);

  return {
    text: translatedText,
    isTranslating,
    language: currentLanguage
  };
}

/**
 * Hook for bulk translation that automatically updates when language changes
 */
export function useBulkAutoTranslation(texts: string[], context?: string) {
  const { currentLanguage, translateBulk, revision } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const performBulkTranslation = async () => {
      if (texts.length === 0) {
        setTranslatedTexts(texts);
        return;
      }

      setIsTranslating(true);
      try {
        const results = await translateBulk(texts, context);
        setTranslatedTexts(results);
      } catch (error) {
        console.error('Bulk translation error:', error);
        setTranslatedTexts(texts); // Fallback to original texts
      } finally {
        setIsTranslating(false);
      }
    };

    performBulkTranslation();
  }, [texts, currentLanguage.code, translateBulk, context, revision]);

  return {
    texts: translatedTexts,
    isTranslating,
    language: currentLanguage
  };
}