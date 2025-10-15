import React from 'react';
import TranslatedText from './TranslatedText';

interface TProps {
  children: React.ReactNode;
  context?: string;
  className?: string;
}

// Simple wrapper component for easier translation
export const T: React.FC<TProps> = ({ children, context, className }) => {
  return (
    <TranslatedText context={context} className={className}>
      {children}
    </TranslatedText>
  );
};

export default T;