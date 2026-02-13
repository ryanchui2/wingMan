'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface Date {
  id: string;
  name: string;
  rating: number | null;
  notes: string | null;
  conversations: Conversation[];
  createdAt: string;
  updatedAt: string;
}

export default function DatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{ dateId: string; rating: number } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch dates
  useEffect(() => {
    const fetchDates = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/dates');
        const data = await response.json();

        if (response.ok) {
          setDates(data.dates);
        }
      } catch (error) {
        console.error('Failed to fetch dates:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDates();
    }
  }, [session]);

  const handleRatingClick = async (dateId: string, rating: number) => {
    try {
      const response = await fetch(`/api/dates/${dateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        setDates(dates.map(d => d.id === dateId ? { ...d, rating } : d));
        setEditingRating(null);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const handleNotesSave = async (dateId: string) => {
    try {
      const response = await fetch(`/api/dates/${dateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (response.ok) {
        setDates(dates.map(d => d.id === dateId ? { ...d, notes: notesValue } : d));
        setEditingNotes(null);
        setNotesValue('');
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handlePrintPdf = async (date: Date) => {
    if (date.conversations.length === 0) {
      alert('No conversations linked to this date');
      return;
    }

    setGeneratingPdf(date.id);

    try {
      // Fetch all conversations with messages
      const response = await fetch('/api/conversations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      // Filter to only linked conversations and compile content
      const linkedConversationIds = date.conversations.map(c => c.id);
      const linkedConversations = data.conversations.filter(
        (c: { id: string }) => linkedConversationIds.includes(c.id)
      );

      // Compile only the last AI response from each conversation (finalized date plan)
      let content = '';
      linkedConversations.forEach((conv: { title: string; messages: { role: string; content: string }[] }) => {
        const assistantMessages = conv.messages.filter(
          (m: { role: string }) => m.role === 'assistant'
        );
        if (assistantMessages.length > 0) {
          content += `## ${conv.title}\n\n`;
          // Only include the last assistant message (finalized plan)
          const lastMessage = assistantMessages[assistantMessages.length - 1];
          content += lastMessage.content + '\n\n';
        }
      });

      if (!content.trim()) {
        alert('No AI responses found in linked conversations');
        setGeneratingPdf(null);
        return;
      }

      // Generate PDF
      const pdfResponse = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateName: date.name,
          content,
        }),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${date.name.replace(/[^a-z0-9]/gi, '_')}_wingMan.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleDeleteDate = async (dateId: string) => {
    if (!confirm('Are you sure you want to delete this date?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dates/${dateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from state
        setDates(dates.filter(d => d.id !== dateId));
      } else {
        alert('Failed to delete date');
      }
    } catch (error) {
      console.error('Failed to delete date:', error);
      alert('Failed to delete date');
    }
  };

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
          DATES
        </h1>

        {/* Dates List */}
        {dates.length === 0 ? (
          <div className="bg-white border-4 border-black p-8 text-center">
            <p className="text-lg font-mono text-gray-600 mb-4">
              No dates yet.
            </p>
            <Link
              href="/history"
              className="inline-block px-6 py-3 bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors font-mono font-bold uppercase"
            >
              Go to History
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div
                key={date.id}
                className="bg-white border-4 border-black p-6"
              >
                {/* Date Name and Delete Button */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold font-mono">
                    {date.name}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrintPdf(date)}
                      disabled={generatingPdf === date.id || date.conversations.length === 0}
                      className="px-3 py-1 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors font-mono font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingPdf === date.id ? 'Generating...' : 'Print PDF'}
                    </button>
                    <button
                      onClick={() => handleDeleteDate(date.id)}
                      className="px-3 py-1 bg-white text-black border-2 border-black hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors font-mono font-bold uppercase text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-sm font-mono uppercase mb-2">Rating</p>
                  <div
                    className="flex gap-2"
                    onMouseLeave={() => setHoveredRating(null)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHovered = hoveredRating?.dateId === date.id && star <= hoveredRating.rating;
                      const isRated = date.rating && star <= date.rating;
                      const shouldHighlight = isHovered || (!hoveredRating && isRated);

                      return (
                        <button
                          key={star}
                          onClick={() => handleRatingClick(date.id, star)}
                          onMouseEnter={() => setHoveredRating({ dateId: date.id, rating: star })}
                          className={`text-2xl ${
                            shouldHighlight
                              ? 'text-yellow-500'
                              : 'text-gray-300'
                          } transition-colors`}
                        >
                          ★
                        </button>
                      );
                    })}
                    {date.rating && (
                      <span className="ml-2 text-sm font-mono text-gray-600">
                        ({date.rating}/5)
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <p className="text-sm font-mono uppercase mb-2">Notes</p>
                  {editingNotes === date.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="w-full px-4 py-2 border-4 border-black font-mono h-24 resize-none"
                        placeholder="How did the date go?"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNotesSave(date.id)}
                          className="px-4 py-2 bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors font-mono font-bold uppercase text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(null);
                            setNotesValue('');
                          }}
                          className="px-4 py-2 bg-white text-black border-4 border-black hover:bg-gray-100 transition-colors font-mono font-bold uppercase text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {date.notes ? (
                        <p className="text-sm text-gray-700 mb-2">{date.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mb-2">No notes yet</p>
                      )}
                      <button
                        onClick={() => {
                          setEditingNotes(date.id);
                          setNotesValue(date.notes || '');
                        }}
                        className="px-4 py-2 bg-white text-black border-4 border-black hover:bg-gray-100 transition-colors font-mono font-bold uppercase text-sm"
                      >
                        {date.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Linked Conversations */}
                <div>
                  <p className="text-sm font-mono uppercase mb-2">
                    Linked Conversations ({date.conversations.length})
                  </p>
                  {date.conversations.length === 0 ? (
                    <div className="p-3 border-2 border-gray-300">
                      <p className="text-sm text-gray-400 italic font-mono">
                        No conversations linked yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {date.conversations.map((conversation) => (
                        <div key={conversation.id} className="p-3 border-2 border-gray-300">
                          <Link
                            href={`/?conversationId=${conversation.id}`}
                            className="font-mono text-sm hover:underline block"
                          >
                            {conversation.title}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-xs text-gray-500 font-mono">
                    Created: {new Date(date.createdAt).toLocaleDateString()} at {new Date(date.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
