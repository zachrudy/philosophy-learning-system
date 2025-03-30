// src/app/api/student/available-lectures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { PROGRESS_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const includeInProgress = searchParams.get('includeInProgress') === 'true';
    const category = searchParams.get('category');

    // Get all lectures
    const lectures = await prisma.lecture.findMany({
      where: category ? { category } : undefined,
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ],
    });

    // Get user's progress records
    const progressRecords = await prisma.progress.findMany({
      where: { userId },
    });

    // Map progress to lectures
    const availableLectures = await Promise.all(lectures.map(async (lecture) => {
      // Find progress for this lecture
      const progress = progressRecords.find(p => p.lectureId === lecture.id);

      // For new students with no progress, make first lecture in each category available
      const isFirstInCategory = !progressRecords.some(p =>
        lectures.find(l => l.id === p.lectureId)?.category === lecture.category
      );

      // Determine status based on progress or first-lecture rule
      let status = progress?.status || (isFirstInCategory ? PROGRESS_STATUS.READY : PROGRESS_STATUS.LOCKED);
      let isCompleted = status === PROGRESS_STATUS.MASTERED;
      let isInProgress = [
        PROGRESS_STATUS.STARTED,
        PROGRESS_STATUS.WATCHED,
        PROGRESS_STATUS.INITIAL_REFLECTION,
        PROGRESS_STATUS.MASTERY_TESTING
      ].includes(status);
      let isAvailable = status === PROGRESS_STATUS.READY;

      // For lectures without progress, check prerequisites
      if (!progress) {
        // Get prerequisites for this lecture
        const prerequisites = await prisma.lecturePrerequisite.findMany({
          where: { lectureId: lecture.id },
          include: { prerequisiteLecture: true }
        });

        // If no prerequisites or it's the first lecture, make it available
        if (prerequisites.length === 0 || isFirstInCategory) {
          status = PROGRESS_STATUS.READY;
          isAvailable = true;
        } else {
          // Check if prerequisites are satisfied
          const requiredPrereqs = prerequisites.filter(p => p.isRequired);
          const requiredCompleted = requiredPrereqs.every(p => {
            const prereqProgress = progressRecords.find(pr => pr.lectureId === p.prerequisiteLectureId);
            return prereqProgress?.status === PROGRESS_STATUS.MASTERED;
          });

          if (requiredCompleted) {
            status = PROGRESS_STATUS.READY;
            isAvailable = true;
          }
        }
      }

      // Filter out based on includeInProgress
      if (!includeInProgress && isInProgress) {
        return null;
      }

      return {
        lecture,
        status,
        isCompleted,
        isInProgress,
        isAvailable,
        readinessScore: 100, // Simplified readiness score
        prerequisitesSatisfied: isAvailable || isInProgress || isCompleted
      };
    }));

    // Filter out null values from the mapping
    const filteredLectures = availableLectures.filter(Boolean);

    return NextResponse.json({
      data: filteredLectures,
      metadata: {
        totalCount: filteredLectures.length,
        availableCount: filteredLectures.filter(l => l.isAvailable).length,
        inProgressCount: filteredLectures.filter(l => l.isInProgress).length,
        completedCount: filteredLectures.filter(l => l.isCompleted).length
      }
    });
  } catch (error) {
    console.error('Error in GET /api/student/available-lectures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
