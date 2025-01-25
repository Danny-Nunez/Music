import type { Metadata } from 'next';
import StructuredData from './components/StructuredData';
import { Inter } from 'next/font/google';
import './globals.css';
import 'swiper/css';
import 'swiper/css/navigation';
import Providers from '../components/Providers';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';

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
  manifest: '/site.webmanifest',
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
      <body className={`${inter.className} bg-black`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col pl-0 md:pl-64">
              <Header />
              <div className="flex-1 overflow-y-auto">
                <main className="pt-20">
                  {children}
                </main>
                <Footer />
              </div>
              <Player />
            </div>
          </div>
          <Toaster // Add the Toaster here
            position="bottom-center" // Position of notifications
            reverseOrder={false} // Show new toasts at the bottom
          />
        </Providers>
      </body>
    </html>
  );
}
