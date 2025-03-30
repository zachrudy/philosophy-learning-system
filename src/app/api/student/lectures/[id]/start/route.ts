// src/app/api/student/lectures/[id]/start/route.ts
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

    // Check if prerequisites are satisfied
    const prerequisites = await prisma.lecturePrerequisite.findMany({
      where: {
        lectureId,
        isRequired: true
      },
    });

    // If there are required prerequisites, check if all are completed
    if (prerequisites.length > 0) {
      const userProgress = await prisma.progress.findMany({
        where: {
          userId,
          lectureId: {
            in: prerequisites.map(p => p.prerequisiteLectureId)
          },
          status: PROGRESS_STATUS.MASTERED
        },
      });

      // If not all required prerequisites are completed, return error
      if (userProgress.length < prerequisites.length) {
        return NextResponse.json(
          { error: 'Prerequisites not satisfied' },
          { status: 400 }
        );
      }
    }

    // Check if progress record already exists
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      },
    });

    if (progress) {
      // If already started and beyond, don't reset progress
      if (
        progress.status !== PROGRESS_STATUS.LOCKED &&
        progress.status !== PROGRESS_STATUS.READY
      ) {
        return NextResponse.json(
          {
            message: 'Lecture already started',
            data: progress
          }
        );
      }

      // Update existing progress record
      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          status: PROGRESS_STATUS.STARTED,
          lastViewed: new Date()
        },
      });
    } else {
      // Create new progress record
      progress = await prisma.progress.create({
        data: {
          userId,
          lectureId,
          status: PROGRESS_STATUS.STARTED,
          lastViewed: new Date()
        },
      });
    }

    return NextResponse.json({
      message: 'Lecture started successfully',
      data: progress
    });
  } catch (error) {
    console.error('Error in POST /api/student/lectures/[id]/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
