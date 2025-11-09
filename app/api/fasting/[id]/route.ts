import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/fasting/[id] - Update a fasting session (mark as complete)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { isActive, completedAt, endTime } = body;

    const session = await prisma.fastingSession.update({
      where: { id },
      data: {
        isActive: isActive ?? false,
        completedAt: completedAt ? new Date(completedAt) : null,
        endTime: endTime ? new Date(endTime) : null,
      },
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error updating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to update fasting session' },
      { status: 500 }
    );
  }
}
