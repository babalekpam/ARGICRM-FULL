import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PageTranslatorProps {
  children: React.ReactNode;
  context?: string;
  excludeSelectors?: string[];
  className?: string;
}

export const PageTranslator: React.FC<PageTranslatorProps> = ({
  children,
  context = 'page-content',
  excludeSelectors = [
    'script',
    'style',
    'code',
    'pre',
    '[data-no-translate]',
    '.no-translate',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="url"]',
    '[contenteditable="false"]'
  ],
  className
}) => {
  const { translateBulk, currentLanguage, revision } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const originalTextsRef = useRef<Map<Element, string>>(new Map());

  // Utility to check if element should be excluded from translation
  const shouldExcludeElement = (element: Element): boolean => {
    return excludeSelectors.some(selector => element.matches(selector));
  };

  // Utility to get all text nodes from an element
  const getTextNodes = (element: Element): Text[] => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || shouldExcludeElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty or whitespace-only text nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }
    return textNodes;
  };

  // OPTIMIZED: Debounced translation to prevent excessive calls during navigation
  const translatePageContent = async () => {
    if (!containerRef.current) return;

    // Skip translation for English to improve performance
    if (currentLanguage.code === 'en' || currentLanguage.code === 'english') return;

    const textNodes = getTextNodes(containerRef.current);
    if (textNodes.length === 0) return;

    const textsToTranslate: string[] = [];
    const nodeTextMap = new Map<Text, string>();

    // Collect texts and store original content (optimized)
    textNodes.forEach(textNode => {
      const originalText = textNode.textContent?.trim();
      if (originalText && originalText.length > 1) { // Skip single characters
        // Store original text if not already stored
        if (!originalTextsRef.current.has(textNode.parentElement!)) {
          originalTextsRef.current.set(textNode.parentElement!, originalText);
        }
        
        textsToTranslate.push(originalText);
        nodeTextMap.set(textNode, originalText);
      }
    });

    if (textsToTranslate.length === 0) return;

    try {
      // Translate all texts in bulk with timeout
      const translatedTexts = await Promise.race([
        translateBulk(textsToTranslate, context),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 3000))
      ]) as string[];
      
      // Apply translations back to DOM
      let textIndex = 0;
      textNodes.forEach(textNode => {
        if (nodeTextMap.has(textNode) && translatedTexts[textIndex]) {
          const translatedText = translatedTexts[textIndex];
          if (translatedText !== textNode.textContent) {
            textNode.textContent = translatedText;
          }
        }
        textIndex++;
      });
    } catch (error) {
      console.error('Page translation error:', error);
    }
  };

  // Restore original texts (used when switching back to default language)
  const restoreOriginalTexts = () => {
    if (!containerRef.current) return;
    
    originalTextsRef.current.forEach((originalText, element) => {
      if (element && element.textContent !== originalText) {
        const textNodes = getTextNodes(element);
        if (textNodes.length > 0) {
          textNodes[0].textContent = originalText;
        }
      }
    });
  };

  // Effect to handle language changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLanguage.code === 'en') {
        // Restore original texts for English
        restoreOriginalTexts();
      } else {
        // Translate to target language
        translatePageContent();
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [currentLanguage.code, revision]);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChange = () => {
      setTimeout(() => {
        if (currentLanguage.code === 'en') {
          restoreOriginalTexts();
        } else {
          translatePageContent();
        }
      }, 100);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [currentLanguage.code]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default PageTranslator;