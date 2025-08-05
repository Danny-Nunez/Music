import type { Metadata } from 'next';
import StructuredData from './components/StructuredData';
import { Inter } from 'next/font/google';
import './globals.css';
import 'swiper/css';
import 'swiper/css/navigation';
import Providers from '../components/Providers';
import { Toaster } from 'react-hot-toast';
import Player from './components/Player';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Beatinbox - Music Streaming Platform',
    template: '%s | Beatinbox'
  },
  description: 'Discover and stream music on Beatinbox - Your ultimate music streaming platform. Explore artists, albums, and playlists.',
  keywords: ['music streaming', 'online music', 'music platform', 'stream music', 'music discovery'],
  metadataBase: new URL('https://beatinbox.com'),
  openGraph: {
    title: 'Beatinbox - Music Streaming Platform',
    description: 'Discover and stream music on Beatinbox - Your ultimate music streaming platform.',
    url: 'https://beatinbox.com',
    siteName: 'Beatinbox',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beatinbox - Music Streaming Platform',
    description: 'Discover and stream music on Beatinbox - Your ultimate music streaming platform.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Player />
          <div className="fixed z-[99999999]">
          <Toaster
            position="bottom-center"
            reverseOrder={false}
          /></div>
        </Providers>
      </body>
    </html>
  );
}
