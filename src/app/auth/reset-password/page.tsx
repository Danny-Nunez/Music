'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    setToken(tokenFromUrl);
    logger.debug('Reset token received', { hasToken: !!tokenFromUrl }); // Only log presence, not actual token
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid or missing reset token.');
      logger.warn('Password reset attempted without token');
      return;
    }

    setLoading(true);
    try {
      logger.debug('Submitting password reset request');

      const response = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      logger.debug('Password reset response received', { status: response.status });

      const contentType = response.headers.get('Content-Type');
      let data;
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        logger.error('Unexpected response format from password reset API', { contentType });
        throw new Error('Unexpected response format.');
      }

      logger.debug('Password reset API response processed', { success: response.ok });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      toast.success('Password reset successfully. You can now log in.');
      router.push('/auth/signin');
    } catch (error) {
      logger.error('Password reset failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error(error instanceof Error ? error.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <Image src="/logo.png" alt="Beatinbox Logo" width={50} height={50} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400">Enter your new password below.</p>
        </div>
        {token ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="password" className="block text-gray-400 mb-2">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md bg-[#3E3E3E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className={`w-full bg-red-600 text-white px-4 py-2 rounded-md transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        ) : (
          <p className="text-center text-red-500">Invalid or missing token.</p>
        )}
        <Button
          onClick={handleBack}
          className="w-full mt-4 bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
