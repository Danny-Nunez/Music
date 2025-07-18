'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full py-4 mb-24 mt-12">
      <div className="max-w-screen-lg mr-auto px-4 sm:px-6">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
          <div className="flex flex-col md:flex-row justify-center items-center text-sm text-gray-400 space-y-2 md:space-y-0 md:space-x-6">
        <div className="flex space-x-6">
          <Link
            href="/privacy"
            className="hover:text-white transition-colors"
            onClick={(e) => {
              // Prevent any interference with video playback
              e.stopPropagation();
            }}
          >
            Privacy Policy
          </Link>
          <span className=" text-gray-600">-</span>
          <Link
            href="/terms"
            className="hover:text-white transition-colors"
            onClick={(e) => {
              // Prevent any interference with video playback
              e.stopPropagation();
            }}
          >
            Terms & Conditions
          </Link>
        </div>
        <span className="hidden md:inline text-gray-600">-</span>
        <span className="text-center md:text-left">
          © {currentYear} Beatinbox
        </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
 