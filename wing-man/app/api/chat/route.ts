import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/api/gemini';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { GUEST_LIMITS } from '@/lib/guestLimits';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated OR has a valid guest token
    const session = await auth();
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get(GUEST_LIMITS.COOKIE_NAME);

    // For guest users, check message limit
    let isGuest = false;
    let guestSessionData = null;

    if (!session && guestCookie) {
      isGuest = true;
      try {
        guestSessionData = JSON.parse(guestCookie.value);

        // Check if guest has exceeded message limit
        if (guestSessionData.messagesUsed >= GUEST_LIMITS.MAX_MESSAGES) {
          return NextResponse.json(
            { error: `Guest limit reached. You've used all ${GUEST_LIMITS.MAX_MESSAGES} messages. Please sign in to continue.` },
            { status: 403 }
          );
        }
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid guest session' },
          { status: 401 }
        );
      }
    }

    if (!session && !guestCookie) {
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

    // Increment guest message counter if guest user
    if (isGuest && guestSessionData) {
      guestSessionData.messagesUsed += 1;
      cookieStore.set(GUEST_LIMITS.COOKIE_NAME, JSON.stringify(guestSessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: GUEST_LIMITS.SESSION_DURATION,
        path: '/',
      });
    }

    return NextResponse.json({
      reply,
      isGuest,
      messagesRemaining: isGuest && guestSessionData
        ? GUEST_LIMITS.MAX_MESSAGES - guestSessionData.messagesUsed
        : null,
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
