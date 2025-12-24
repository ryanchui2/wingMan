'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (response.ok) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchConversations();
    }
  }, [session]);

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e2c0d7] to-white flex items-center justify-center">
        <p className="text-xl font-mono">Loading...</p>
      </div>
    );
  }

  // If not logged in, don't render
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e2c0d7] to-white px-8 py-16">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black hover:underline font-mono font-bold uppercase text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black text-center mb-12 text-black tracking-tighter">
          HISTORY
        </h1>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white border-4 border-black p-8 text-center">
            <p className="text-lg font-mono text-gray-600">
              No conversations yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* TODO: Create a component for conversation cards later */}

            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white border-4 border-black p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2 font-mono">
                      {conversation.title}
                    </h2>
                    <p className="text-sm text-gray-600 font-mono">
                      {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-mono uppercase">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {new Date(conversation.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Preview first message */}
                {conversation.messages.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <p className="text-sm text-gray-700 truncate">
                      {conversation.messages[1].content.length > 100
                        ? conversation.messages[1].content.slice(0, 167) + '...'
                        : conversation.messages[1].content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}