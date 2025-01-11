'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    console.log('Token extracted from URL:', tokenFromUrl); // Debug log
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid or missing reset token.');
      console.error('No token provided.'); // Debug log
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to reset password...'); // Debug log
      const response = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      toast.success('Password reset successfully. You can now log in.');
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error during password reset:', error); // Debug log
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
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Reset Password</h1>
        {token ? (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Reset Password'}
            </Button>
          </form>
        ) : (
          <p className="text-center text-red-500">Invalid or missing token.</p>
        )}
        <Button onClick={handleBack} className="w-full mt-4">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
