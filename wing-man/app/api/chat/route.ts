import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/api/anthropic';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated OR has a valid guest token
    const session = await auth();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get('guest_token');

    if (!session && !guestToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in or use as guest.' },
        { status: 401 }
      );
    }

    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch user profile, conversation history, and past dates if logged in
    let userProfile = null;
    let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
    let pastDates = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { profile: true },
      });

      if (user) {
        userProfile = user.profile;

        // Fetch conversation history if conversationId exists
        if (conversationId) {
          const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId: user.id },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          if (conversation) {
            conversationHistory = conversation.messages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }));
          }
        }

        // Fetch all past dates with ratings/notes for learning context
        const userDates = await prisma.date.findMany({
          where: {
            userId: user.id,
            OR: [
              { rating: { not: null } },
              { notes: { not: null } },
            ],
          },
          select: {
            name: true,
            rating: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (userDates.length > 0) {
          pastDates = userDates;
        }
      }
    }

    // Generate AI response with conversation history, user profile, and past dates
    const reply = await generateChatResponse(message, conversationHistory, userProfile, pastDates);

    // Save to database if user is logged in
    let savedConversationId = conversationId;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        // Create or get conversation
        let conversation;
        if (conversationId) {
          conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId: user.id },
          });
        }

        if (!conversation) {
          // Create new conversation with title from first message
          conversation = await prisma.conversation.create({
            data: {
              userId: user.id,
              title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            },
          });
          savedConversationId = conversation.id;
        }

        // Save user message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
          },
        });

        // Save assistant response
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: reply,
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      reply,
      isGuest: !session && !!guestToken,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
