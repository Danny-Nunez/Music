'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import the useRouter hook
import ResetPasswordModal from '@/components/ResetPasswordModal';

export default function ForgotPasswordPage() {
  const [showModal, setShowModal] = useState(true);
  const router = useRouter(); // Initialize the router

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
    router.push('/'); // Redirect to the home page
  };

  return (
    <>
      {showModal && <ResetPasswordModal onClose={handleCloseModal} />}
    </>
  );
}
