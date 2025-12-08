'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e2c0d7] to-white px-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <h1 className="text-6xl md:text-7xl font-black text-center mb-12 text-black tracking-tighter">
          WINGMAN
        </h1>

        {/* Login Card */}
        <div className="bg-white border-4 border-black p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center font-mono uppercase">
            Sign In
          </h2>

          <p className="text-center text-gray-600">
            Sign in to save your date plans and preferences
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-4 border-black hover:bg-black hover:text-white transition-colors font-mono font-bold uppercase"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-mono">
                OR
              </span>
            </div>
          </div>

          {/* Guest Continue Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-4 bg-gray-100 border-4 border-black hover:bg-gray-200 transition-colors font-mono font-bold uppercase"
          >
            Continue as Guest
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-600 mt-6 font-mono">
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
