'use client';

import { Inter } from 'next/font/google';
import '../globals.css';
import 'swagger-ui-react/swagger-ui.css';
import Providers from '../../components/Providers';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use client-side only rendering to avoid strict mode warnings from swagger-ui
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`${inter.className} min-h-screen bg-white`}>
      <Providers>
        {children}
      </Providers>
    </div>
  );
}
