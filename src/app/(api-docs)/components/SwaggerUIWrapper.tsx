'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI with no SSR to avoid hydration issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerUIWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only render SwaggerUI on client side
    setIsClient(true);
    
    // Suppress console warnings
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('UNSAFE_')) return;
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 w-full h-screen bg-white z-50">
      <SwaggerUI
        url="/api/docs"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        persistAuthorization={true}
      />
    </div>
  );
}
