import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/dates/[id] - Update a date (rating, notes)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { rating, notes } = await req.json();

    // Verify ownership
    const existingDate = await prisma.date.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingDate) {
      return NextResponse.json(
        { error: 'Date not found' },
        { status: 404 }
      );
    }

    // Update the date
    const updatedDate = await prisma.date.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ date: updatedDate });
  } catch (error) {
    console.error('Failed to update date:', error);
    return NextResponse.json(
      { error: 'Failed to update date' },
      { status: 500 }
    );
  }
}

// DELETE /api/dates/[id] - Delete a date
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify ownership
    const existingDate = await prisma.date.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingDate) {
      return NextResponse.json(
        { error: 'Date not found' },
        { status: 404 }
      );
    }

    // Delete the date (conversation will cascade delete due to onDelete: Cascade)
    await prisma.date.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete date:', error);
    return NextResponse.json(
      { error: 'Failed to delete date' },
      { status: 500 }
    );
  }
}
