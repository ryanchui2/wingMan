'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e2c0d7] to-white flex items-center justify-center">
        <p className="text-xl font-mono">Loading...</p>
      </div>
    );
  }

  // If not logged in, don't render (redirect handled in useEffect)
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e2c0d7] to-white px-8 py-16">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black hover:underline font-mono font-bold uppercase text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
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
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-600 mt-6 font-mono">
          Signed in with Google
        </p>
      </div>
    </div>
  );
}
