'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const SessionProviderWrapper = SessionProvider as React.ComponentType<{
    children: ReactNode;
  }>;
  
  return (
    <SessionProviderWrapper>
      {children}
    </SessionProviderWrapper>
  );
}
