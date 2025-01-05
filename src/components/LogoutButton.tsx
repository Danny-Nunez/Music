'use client';

import { signOut } from 'next-auth/react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LogoutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      <span>Logout</span>
    </button>
  );
}