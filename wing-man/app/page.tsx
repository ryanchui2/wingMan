'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import WelcomeScreen from './components/WelcomeScreen';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const guestTokenCreated = useRef(false);

  // Check if user has auth or guest token on mount
  useEffect(() => {
    const checkToken = async () => {
      // If authenticated, they have access
      if (session) {
        setHasToken(true);
        setShowWelcome(false);
        return;
      }

      // Check if they have a guest token cookie
      try {
        const response = await fetch('/api/check-token');
        const data = await response.json();
        if (data.hasToken) {
          setHasToken(true);
          setShowWelcome(false);
          guestTokenCreated.current = true;
        }
      } catch (error) {
        console.error('Failed to check token:', error);
      }
    };

    // Only check when session loading is complete
    if (status !== 'loading') {
      checkToken();
    }
  }, [session, status]);

  const handleGuestContinue = async () => {
    try {
      await fetch('/api/guest', { method: 'POST' });
      guestTokenCreated.current = true;
      setHasToken(true);
      setShowWelcome(false);
    } catch (error) {
      console.error('Failed to create guest session:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Block if no token
    if (!session && !hasToken) {
      setShowWelcome(true);
      return;
    }

    setLoading(true);
    setReply('');
    setHasSubmitted(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (response.ok) {
        setReply(data.reply);
      } else {
        setReply('Error: ' + (data.error || 'Failed to get response'));
      }
    } catch (error) {
      setReply('Error: Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Show welcome screen if no token
  if (showWelcome) {
    return <WelcomeScreen onGuestContinue={handleGuestContinue} />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#e2c0d7] to-white">
      {/* Main Content */}
      <main className={`flex-1 flex px-8 py-16 md:px-16 lg:px-24 transition-all duration-700 overflow-hidden ${
        hasSubmitted ? 'items-start' : 'items-center justify-center'
      }`}>
        <div className={`flex gap-8 w-full transition-all duration-700 h-full ${
          hasSubmitted ? 'flex-row items-start' : 'flex-col items-center max-w-3xl justify-center'
        }`}>
          {/* Site Name - Brutalist Typography */}
          <h1 className={`font-black text-black transition-all duration-700 ${
            hasSubmitted
              ? 'writing-mode-vertical text-3xl md:text-4xl tracking-tighter leading-none shrink-0'
              : 'text-[6vw] sm:text-[5vw] md:text-[4rem] lg:text-[5rem] leading-none mb-2 tracking-tighter'
          }`}
          style={hasSubmitted ? { writingMode: 'vertical-rl', textOrientation: 'upright' } : {}}
          >
            WINGMAN
          </h1>

            <div className={`flex transition-all duration-700 ${hasSubmitted ? 'w-full h-full' : 'w-full justify-center'}`}>
            {/* Chat Input - Only show when not submitted */}
            {!hasSubmitted && (
              <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="what's the plan?"
                    disabled={loading}
                    className="w-full px-4 py-3 text-xl md:text-xl bg-white border-4 border-black text-black placeholder-gray-400 focus:outline-none focus:border-black font-mono disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full px-4 py-3 text-base md:text-lg bg-black text-white border-4 border-black font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {loading ? 'cooking...' : 'ask wingman'}
                </button>
              </form>
            )}

            {/* Response - Show as full text box when submitted */}
            {hasSubmitted && (
              <div className="h-full w-full flex flex-col gap-3">
                {/* User's question */}
                <div className="p-3 bg-black text-white border-4 border-black flex-shrink-0">
                  <p className="text-base md:text-lg font-mono font-bold">
                    {message}
                  </p>
                </div>

                {/* AI Response - Fixed height scrollable */}
                <div className="flex-1 p-6 bg-white border-4 border-black overflow-y-auto min-h-0">
                  {loading ? (
                    <p className="text-base md:text-lg text-gray-400 font-mono">cooking...</p>
                  ) : (
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {reply}
                    </p>
                  )}
                </div>

                {/* New question button */}
                <button
                  onClick={() => {
                    setHasSubmitted(false);
                    setMessage('');
                    setReply('');
                  }}
                  className="px-4 py-2 text-sm md:text-base bg-black text-white border-4 border-black font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors font-bold flex-shrink-0"
                >
                  ask another question
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="flex flex-wrap gap-8 text-sm md:text-base font-mono uppercase tracking-wider">
            <a href="#" className="hover:underline font-bold">
              Dates
            </a>
            <Link href="/profile" className="hover:underline font-bold">
              Profile
            </Link>
            <a href="#" className="hover:underline font-bold">
              History
            </a>
            <a href="#" className="hover:underline font-bold">
              About
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
