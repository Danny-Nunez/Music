import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'swiper/css';
import 'swiper/css/navigation';
import Providers from '../components/Providers';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beatinbox',
  description: 'Your music streaming platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col pl-0 md:pl-64">
              <Header />
              <main className="flex-1 pt-20 pb-24">
                {children}
              </main>
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
