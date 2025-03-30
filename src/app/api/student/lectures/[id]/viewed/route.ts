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
    // Check authentication
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: lectureId } = params;

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

    // Check if progress record exists
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      },
    });

    if (!progress) {
      // Create a new progress record if one doesn't exist
      progress = await prisma.progress.create({
        data: {
          userId,
          lectureId,
          status: PROGRESS_STATUS.WATCHED, // Skip STARTED and go straight to WATCHED
          lastViewed: new Date()
        },
      });
    } else {
      // Only update if status is LOCKED, READY, or STARTED
      // This prevents resetting progress for users who are further along
      if (
        [PROGRESS_STATUS.LOCKED, PROGRESS_STATUS.READY, PROGRESS_STATUS.STARTED].includes(progress.status as any)
      ) {
        progress = await prisma.progress.update({
          where: { id: progress.id },
          data: {
            status: PROGRESS_STATUS.WATCHED,
            lastViewed: new Date()
          },
        });
      } else if (progress.status !== PROGRESS_STATUS.WATCHED) {
        // If progress is beyond WATCHED, just update lastViewed
        progress = await prisma.progress.update({
          where: { id: progress.id },
          data: {
            lastViewed: new Date()
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Lecture marked as viewed',
      data: progress
    });
  } catch (error) {
    console.error('Error in POST /api/student/lectures/[id]/viewed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
