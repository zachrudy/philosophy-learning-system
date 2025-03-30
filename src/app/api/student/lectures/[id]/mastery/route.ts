// src/app/api/student/lectures/[id]/mastery/route.ts
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

    // Parse request body to get score
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate score
    const { score } = body;
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Score must be a number between 0 and 100' },
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
      return NextResponse.json(
        { error: 'No progress record found for this lecture' },
        { status: 404 }
      );
    }

    // Check if user is at the MASTERY_TESTING stage
    // If not, allow skipping ahead only if they've at least watched the lecture
    if (
      progress.status !== PROGRESS_STATUS.MASTERY_TESTING &&
      progress.status !== PROGRESS_STATUS.INITIAL_REFLECTION &&
      ![PROGRESS_STATUS.WATCHED, PROGRESS_STATUS.MASTERED].includes(progress.status as any)
    ) {
      return NextResponse.json(
        { error: 'Must complete initial reflection before submitting mastery score' },
        { status: 400 }
      );
    }

    // Determine new status based on score
    // 70 is the threshold for mastery
    const newStatus = score >= 70 ? PROGRESS_STATUS.MASTERED : PROGRESS_STATUS.INITIAL_REFLECTION;

    // Update progress record
    progress = await prisma.progress.update({
      where: { id: progress.id },
      data: {
        status: newStatus,
        lastViewed: new Date(),
        ...(newStatus === PROGRESS_STATUS.MASTERED ? { completedAt: new Date() } : {})
      },
    });

    // Find the most recent mastery reflection and update it with the score
    const reflection = await prisma.reflection.findFirst({
      where: {
        userId,
        lectureId,
        promptType: 'mastery'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (reflection) {
      await prisma.reflection.update({
        where: { id: reflection.id },
        data: {
          status: score >= 70 ? 'MASTERY_ACHIEVED' : 'EVALUATED',
          score
        }
      });
    }

    return NextResponse.json({
      message: score >= 70 ? 'Mastery achieved' : 'Mastery not achieved yet',
      data: {
        progress,
        masteryThreshold: 70,
        mastered: score >= 70
      }
    });
  } catch (error) {
    console.error('Error in POST /api/student/lectures/[id]/mastery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
