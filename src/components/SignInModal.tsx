'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SignInModalProps {
  onClose: () => void;
}

export default function SignInModal({ onClose }: SignInModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to register');
        }

        toast.success('Registration successful! Please sign in.');
        setIsRegistering(false);
        resetForm();
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        toast.success('Signed in successfully!');
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div className="fixed inset-0 bg-black/90" />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-zinc-800 p-8 rounded-lg shadow-lg max-w-sm w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <img
                src="/logo.png"
                alt="logo"
                className="w-12 h-12 mx-auto mb-2"
              />
              <h1 className="text-3xl font-bold text-white">{isRegistering ? 'BeatInbox' : 'BeatInbox'}</h1>
              <p className="text-gray-400">{isRegistering ? 'Sign up to continue' : ''}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-4">
            {isRegistering && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-[#3E3E3E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#3E3E3E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-[#3E3E3E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-red-600 text-white px-4 py-2 rounded-md transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRegistering ? 'Registering...' : 'Signing In...'}
                </span>
              ) : (
                isRegistering ? 'Register' : 'Sign In'
              )}
            </button>
          </form>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#282828] text-gray-400">Or</span>
            </div>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 bg-white text-black px-4 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            <Image
              src="/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-gray-400 mt-4 hover:text-white transition-colors text-sm"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}