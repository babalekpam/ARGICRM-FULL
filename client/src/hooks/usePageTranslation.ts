import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const usePageTranslation = (options?: {
  context?: string;
  autoTranslate?: boolean;
  excludeSelectors?: string[];
}) => {
  const { currentLanguage, translateBulk, revision } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  
  const {
    context = 'page-content',
    autoTranslate = true,
    excludeSelectors = [
      'script',
      'style',
      'code',
      'pre',
      '[data-no-translate]',
      '.no-translate',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="url"]'
    ]
  } = options || {};

  // Manually trigger translation for specific elements or the entire page
  const translatePage = async (rootElement?: Element) => {
    if (currentLanguage.code === 'en') return;
    
    setIsTranslating(true);
    
    try {
      const container = rootElement || document.body;
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            // Skip excluded elements
            if (excludeSelectors.some(selector => parent.matches(selector))) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Skip empty text
            if (!node.textContent?.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes: Text[] = [];
      const texts: string[] = [];
      let node;
      
      while ((node = walker.nextNode())) {
        const textContent = node.textContent?.trim();
        if (textContent) {
          textNodes.push(node as Text);
          texts.push(textContent);
        }
      }

      if (texts.length > 0) {
        const translations = await translateBulk(texts, context);
        
        textNodes.forEach((textNode, index) => {
          if (translations[index]) {
            textNode.textContent = translations[index];
          }
        });
      }
    } catch (error) {
      console.error('Page translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-translate when language changes
  useEffect(() => {
    if (autoTranslate && currentLanguage.code !== 'en') {
      const timer = setTimeout(() => {
        translatePage();
      }, 300); // Delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [currentLanguage.code, revision, autoTranslate]);

  return {
    translatePage,
    isTranslating,
    currentLanguage,
    isRTL: ['ar', 'he', 'fa', 'ur'].includes(currentLanguage.code)
  };
};