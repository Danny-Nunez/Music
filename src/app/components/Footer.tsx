'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-black/50 backdrop-blur-sm border-t border-gray-800 py-4 px-6 mb-24 mt-12">
      <div className="max-w-7xl mx-auto flex justify-center items-center space-x-6 text-sm text-gray-400">
        <Link 
          href="/privacy" 
          className="hover:text-white transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-gray-600">•</span>
        <Link 
          href="/terms" 
          className="hover:text-white transition-colors"
        >
          Terms & Conditions
        </Link>
        <span className="text-gray-600">•</span>
        <span>© 2025 Beatinbox</span>
      </div>
    </footer>
  );
}