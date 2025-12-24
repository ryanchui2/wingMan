'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import WelcomeScreen from './components/WelcomeScreen';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const guestTokenCreated = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationLoaded = useRef(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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

    const userMessage = message;

    // Reset delete confirmation when sending a new message
    setDeleteConfirm(false);

    // Add user message to chat immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant response to chat
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        // Save conversation ID for future messages
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: ' + (data.error || 'Failed to get response') }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Failed to connect to server' }]);
    } finally {
      setLoading(false);
    }
  };

  // Load conversation from URL parameter
  useEffect(() => {
    const loadConversation = async () => {
      const conversationIdParam = searchParams.get('conversationId');

      if (conversationIdParam && session?.user?.email && !conversationLoaded.current) {
        conversationLoaded.current = true;

        try {
          const response = await fetch('/api/conversations');
          const data = await response.json();

          if (response.ok) {
            const conversation = data.conversations.find(
              (c: { id: string; messages: { role: string; content: string }[] }) => c.id === conversationIdParam
            );

            if (conversation) {
              setConversationId(conversation.id);
              setMessages(
                conversation.messages.map((msg: { role: string; content: string }) => ({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content,
                }))
              );
            }
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      }
    };

    if (session && !showWelcome) {
      loadConversation();
    }
  }, [searchParams, session, showWelcome]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show welcome screen if no token
  if (showWelcome) {
    return <WelcomeScreen onGuestContinue={handleGuestContinue} />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#e2c0d7] to-white">
      {/* Main Content */}
      <main className={`flex-1 flex px-8 py-16 md:px-16 lg:px-24 transition-all duration-700 overflow-hidden ${
        messages.length > 0 ? 'items-start' : 'items-center justify-center'
      }`}>
        <div className={`flex gap-8 w-full transition-all duration-700 h-full ${
          messages.length > 0 ? 'flex-row items-start' : 'flex-col items-center max-w-3xl justify-center'
        }`}>
          {/* Site Name - Brutalist Typography */}
          <h1 className={`font-black text-black transition-all duration-700 ${
            messages.length > 0
              ? 'writing-mode-vertical text-3xl md:text-4xl tracking-tighter leading-none shrink-0'
              : 'text-[6vw] sm:text-[5vw] md:text-[4rem] lg:text-[5rem] leading-none mb-2 tracking-tighter'
          }`}
          style={messages.length > 0 ? { writingMode: 'vertical-rl', textOrientation: 'upright' } : {}}
          >
            WINGMAN
          </h1>

          <div className={`flex flex-col transition-all duration-700 ${messages.length > 0 ? 'w-full h-full' : 'w-full justify-center'}`}>
            {/* Chat Messages */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-4 border-4 border-black ${
                      msg.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white text-black'
                    }`}
                  >
                    <div className="text-sm md:text-base leading-relaxed prose prose-sm md:prose-base max-w-none prose-invert:text-white prose-headings:font-bold prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="p-4 bg-white border-4 border-black">
                    <p className="text-sm md:text-base text-gray-400 font-mono">cooking...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Chat Input - Always visible */}
            <form onSubmit={handleSubmit} className={`space-y-3 ${messages.length === 0 ? 'w-full max-w-2xl' : 'w-full'}`}>
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

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="flex-1 px-4 py-3 text-base md:text-lg bg-black text-white border-4 border-black font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {loading ? 'cooking...' : messages.length > 0 ? 'send' : 'ask wingman'}
                </button>
                {messages.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([]);
                        setConversationId(null);
                        setMessage('');
                        setDeleteConfirm(false);
                      }}
                      className="px-4 py-3 text-base md:text-lg bg-white text-black border-4 border-black font-mono uppercase tracking-wider hover:bg-black hover:text-white transition-colors font-bold"
                    >
                      new chat
                    </button>
                    {conversationId && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!deleteConfirm) {
                            setDeleteConfirm(true);
                            return;
                          }

                          // Second click - actually delete
                          try {
                            const response = await fetch(`/api/conversations/${conversationId}`, {
                              method: 'DELETE',
                            });

                            if (response.ok) {
                              setMessages([]);
                              setConversationId(null);
                              setMessage('');
                              setDeleteConfirm(false);
                            } else {
                              alert('Failed to delete conversation');
                              setDeleteConfirm(false);
                            }
                          } catch (error) {
                            console.error('Error deleting conversation:', error);
                            alert('Failed to delete conversation');
                            setDeleteConfirm(false);
                          }
                        }}
                        className="px-4 py-3 text-base md:text-lg bg-white text-black border-4 border-black font-mono uppercase tracking-wider hover:bg-black hover:text-white transition-colors font-bold"
                      >
                        {/* TODO: update button styling */}
                        {deleteConfirm ? 'sure ?' : 'delete'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
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
            <Link href="/history" className="hover:underline font-bold">
              History
            </Link>
            <a href="#" className="hover:underline font-bold">
              About
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
