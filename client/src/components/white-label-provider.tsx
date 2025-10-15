import { ReactNode } from 'react';
import { WhiteLabelContext, useWhiteLabelSettings } from '@/hooks/useWhiteLabel';

interface WhiteLabelProviderProps {
  children: ReactNode;
}

export function WhiteLabelProvider({ children }: WhiteLabelProviderProps) {
  const whiteLabelData = useWhiteLabelSettings();

  return (
    <WhiteLabelContext.Provider value={whiteLabelData}>
      {children}
    </WhiteLabelContext.Provider>
  );
}