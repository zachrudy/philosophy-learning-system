// src/app/api/student/lectures/[id]/viewed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { PROGRESS_STATUS } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST /api/student/lectures/[id]/viewed called');

    // Check authentication
    const session = await getServerSession();
    console.log('Session user:', session?.user);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID by looking up the user with their email
    if (!session.user.email) {
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 400 }
      );
    }

    // Look up the user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const { id: lectureId } = params;

    console.log('Marking lecture as viewed:', { userId, lectureId });

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Check if lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    console.log('Lecture found:', lecture.title);

    // Check if progress record exists
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      },
    });

    console.log('Existing progress:', progress);

    if (!progress) {
      // Create a new progress record
      console.log('Creating new progress record');
      progress = await prisma.progress.create({
        data: {
          userId,
          lectureId,
          status: PROGRESS_STATUS.WATCHED,
          lastViewed: new Date()
        },
      });
    } else {
      // Update existing progress
      console.log('Updating existing progress to WATCHED');
      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          status: PROGRESS_STATUS.WATCHED,
          lastViewed: new Date()
        },
      });
    }

    console.log('Final progress state:', progress);

    return NextResponse.json({
      message: 'Lecture marked as viewed',
      data: progress
    });
  } catch (error) {
    console.error('Error in POST /api/student/lectures/[id]/viewed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
