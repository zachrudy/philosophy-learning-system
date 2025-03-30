// src/app/api/lectures/[id]/completion-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { USER_ROLES, PROGRESS_STATUS } from '@/lib/constants';

export async function GET(
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

    const { id: lectureId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check permissions - users can only view their own completion status unless admin/instructor
    if (userId !== session.user.id &&
        session.user.role !== USER_ROLES.ADMIN &&
        session.user.role !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'You can only view your own completion status' },
        { status: 403 }
      );
    }

    // Check if lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        order: true
      }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Get user's progress for this lecture
    const progress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      }
    });

    // Get reflections for this lecture and user
    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
        lectureId
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group reflections by promptType
    const reflectionsByType = reflections.reduce((acc, reflection) => {
      const { promptType } = reflection;
      if (!acc[promptType]) {
        acc[promptType] = [];
      }
      acc[promptType].push(reflection);
      return acc;
    }, {} as Record<string, any[]>);

    // Determine completion status details
    const isStarted = !!progress;
    const status = progress?.status || PROGRESS_STATUS.LOCKED;
    const isCompleted = status === PROGRESS_STATUS.MASTERED;

    // Calculate the completion percentage based on workflow stage
    let completionPercentage = 0;

    if (isCompleted) {
      completionPercentage = 100;
    } else if (status === PROGRESS_STATUS.MASTERY_TESTING) {
      completionPercentage = 80;
    } else if (status === PROGRESS_STATUS.INITIAL_REFLECTION) {
      completionPercentage = 60;
    } else if (status === PROGRESS_STATUS.WATCHED) {
      completionPercentage = 40;
    } else if (status === PROGRESS_STATUS.STARTED) {
      completionPercentage = 20;
    } else if (status === PROGRESS_STATUS.READY) {
      completionPercentage = 10;
    }

    // Get related information about time spent
    const startDate = progress?.createdAt;
    const completionDate = progress?.completedAt;
    const lastViewedDate = progress?.lastViewed;
    const timeSpent = startDate && completionDate
      ? new Date(completionDate).getTime() - new Date(startDate).getTime()
      : null;

    // Format timeSpent in days, hours, minutes if available
    let formattedTimeSpent = null;
    if (timeSpent !== null) {
      const days = Math.floor(timeSpent / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeSpent % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeSpent % (1000 * 60 * 60)) / (1000 * 60));

      formattedTimeSpent = `${days > 0 ? `${days} day${days !== 1 ? 's' : ''}, ` : ''}${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    // Get the latest mastery score, if available
    let masteryScore = null;
    const masteryReflections = reflectionsByType['mastery'] || [];
    if (masteryReflections.length > 0) {
      // Find the one with evaluation
      const evaluatedReflection = masteryReflections.find(r =>
        r.status === 'EVALUATED' && r.score !== null
      );

      if (evaluatedReflection) {
        masteryScore = evaluatedReflection.score;
      }
    }

    // Build completion status response
    const completionStatus = {
      lectureId,
      userId,
      lecture: {
        title: lecture.title,
        category: lecture.category,
        order: lecture.order
      },
      status,
      isCompleted,
      completionPercentage,
      startDate,
      completionDate,
      lastViewedDate,
      timeSpent: formattedTimeSpent,
      masteryScore,
      reflectionCounts: {
        preLecture: (reflectionsByType['pre-lecture'] || []).length,
        initial: (reflectionsByType['initial'] || []).length,
        mastery: (reflectionsByType['mastery'] || []).length,
        discussion: (reflectionsByType['discussion'] || []).length,
        total: reflections.length
      },
      nextSteps: !isCompleted ? [
        status === PROGRESS_STATUS.LOCKED && 'Complete prerequisites to unlock this lecture',
        status === PROGRESS_STATUS.READY && 'Submit pre-lecture reflection',
        status === PROGRESS_STATUS.STARTED && 'Watch the lecture content',
        status === PROGRESS_STATUS.WATCHED && 'Submit initial reflection',
        status === PROGRESS_STATUS.INITIAL_REFLECTION && 'Submit mastery reflection',
        status === PROGRESS_STATUS.MASTERY_TESTING && 'Submit AI evaluation score'
      ].filter(Boolean)[0] : 'Lecture completed'
    };

    return NextResponse.json(completionStatus);
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/completion-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
