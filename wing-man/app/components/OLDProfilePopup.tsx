'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Handle redirect for non-logged-in users
  useEffect(() => {
    if (isOpen && !session) {
      onClose();
      router.push('/login');
    }
  }, [isOpen, session, onClose, router]);

  // If not open, don't render
  if (!isOpen) return null;

  // If not logged in, don't render (redirect handled in useEffect)
  if (!session) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#e2c0d7] to-white z-50 flex items-center justify-center px-8">
      {/* Close button - top right corner */}
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <h1 className="text-6xl md:text-7xl font-black text-center mb-12 text-black tracking-tighter">
          WINGMAN
        </h1>

        {/* Profile Card */}
        <div className="bg-white border-4 border-black p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center font-mono uppercase">
            Your Profile
          </h2>

          {/* Profile Picture */}
          {session.user?.image && (
            <div className="flex justify-center">
              <img
                src={session.user.image}
                alt={session.user.name || 'Profile'}
                className="w-24 h-24 rounded-full border-4 border-black"
              />
            </div>
          )}

          {/* User Info */}
          <div className="space-y-3">
            {session.user?.name && (
              <div className="text-center">
                <p className="text-xs uppercase text-gray-600 mb-1 font-mono">Name</p>
                <p className="font-bold text-lg">{session.user.name}</p>
              </div>
            )}

            {session.user?.email && (
              <div className="text-center">
                <p className="text-xs uppercase text-gray-600 mb-1 font-mono">Email</p>
                <p className="text-sm break-all text-gray-700">{session.user.email}</p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-6 py-4 bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors font-mono font-bold uppercase"
          >
            Sign Out
          </button>

          <button
          onClick={onClose}
          className="w-full px-4 py-1 bg-gray-100 border-4 border-black hover:bg-gray-200 transition-colors font-mono font-bold uppercase tracking-wider"
          aria-label="Close"
          >
            ✕
          </button>

        </div>
      </div>
    </div>
  );
}
