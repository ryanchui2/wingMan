import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dates - Get all dates for the logged-in user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const dates = await prisma.date.findMany({
      where: { userId: user.id },
      include: {
        conversations: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ dates });
  } catch (error) {
    console.error('Failed to fetch dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dates' },
      { status: 500 }
    );
  }
}

// POST /api/dates - Create a new date
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { name, conversationId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Date name is required' },
        { status: 400 }
      );
    }

    // conversationId is optional - can create a date without linking conversations initially
    if (conversationId) {
      // Verify conversation ownership if provided
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Check if conversation is already linked to another date
      if (conversation.dateId) {
        return NextResponse.json(
          { error: 'This conversation is already linked to a date' },
          { status: 400 }
        );
      }
    }

    // Create the date and optionally link the conversation
    const date = await prisma.date.create({
      data: {
        userId: user.id,
        name,
        ...(conversationId && {
          conversations: {
            connect: { id: conversationId },
          },
        }),
      },
    });

    return NextResponse.json({ date });
  } catch (error) {
    console.error('Failed to create date:', error);
    return NextResponse.json(
      { error: 'Failed to create date' },
      { status: 500 }
    );
  }
}
