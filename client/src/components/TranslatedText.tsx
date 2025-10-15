import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslatedTextProps {
  children: React.ReactNode;
  context?: string;
  className?: string;
  preserveHtml?: boolean;
  fallback?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  children,
  context,
  className,
  preserveHtml = false,
  fallback
}) => {
  const { translate, currentLanguage, isLoading } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');

  // Extract text content from React nodes
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return node.toString();
    if (React.isValidElement(node)) {
      if (node.props.children) {
        return React.Children.toArray(node.props.children)
          .map(extractText)
          .join('');
      }
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    return '';
  };

  useEffect(() => {
    const text = extractText(children);
    setOriginalText(text);

    if (text && text.trim()) {
      translate(text, context)
        .then(setTranslatedContent)
        .catch(() => setTranslatedContent(text));
    }
  }, [children, currentLanguage.code, translate, context]);

  const displayText = translatedContent || originalText || fallback || '';

  if (preserveHtml) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    );
  }

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};

export default TranslatedText;