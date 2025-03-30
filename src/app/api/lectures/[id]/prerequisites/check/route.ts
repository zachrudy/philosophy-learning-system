// src/app/api/lectures/[id]/prerequisites/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { PROGRESS_STATUS } from '@/lib/constants';

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

    // Check if lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { id: true, title: true, category: true }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Get all prerequisites for this lecture
    const prerequisites = await prisma.lecturePrerequisite.findMany({
      where: { lectureId },
      include: {
        prerequisiteLecture: {
          select: {
            id: true,
            title: true,
            category: true,
            order: true
          }
        }
      }
    });

    // If no prerequisites, lecture is available
    if (prerequisites.length === 0) {
      return NextResponse.json({
        satisfied: true,
        requiredPrerequisites: [],
        recommendedPrerequisites: [],
        completedPrerequisites: [],
        missingRequiredPrerequisites: [],
        readinessScore: 100,
        lecture: {
          id: lecture.id,
          title: lecture.title,
          category: lecture.category
        }
      });
    }

    // Get progress for all prerequisite lectures
    const prerequisiteLectureIds = prerequisites.map(p => p.prerequisiteLectureId);

    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        lectureId: { in: prerequisiteLectureIds }
      }
    });

    // Separate required and recommended prerequisites
    const requiredPrerequisites = prerequisites.filter(p => p.isRequired);
    const recommendedPrerequisites = prerequisites.filter(p => !p.isRequired);

    // Find completed prerequisites
    const completedPrerequisites = prerequisites.filter(prerequisite => {
      const progress = progressRecords.find(p => p.lectureId === prerequisite.prerequisiteLectureId);
      return progress?.status === PROGRESS_STATUS.MASTERED;
    });

    // Find completed required prerequisites
    const completedRequiredPrerequisites = requiredPrerequisites.filter(prerequisite => {
      const progress = progressRecords.find(p => p.lectureId === prerequisite.prerequisiteLectureId);
      return progress?.status === PROGRESS_STATUS.MASTERED;
    });

    // Find completed recommended prerequisites
    const completedRecommendedPrerequisites = recommendedPrerequisites.filter(prerequisite => {
      const progress = progressRecords.find(p => p.lectureId === prerequisite.prerequisiteLectureId);
      return progress?.status === PROGRESS_STATUS.MASTERED;
    });

    // Find missing required prerequisites
    const missingRequiredPrerequisites = requiredPrerequisites.filter(prerequisite => {
      const progress = progressRecords.find(p => p.lectureId === prerequisite.prerequisiteLectureId);
      return progress?.status !== PROGRESS_STATUS.MASTERED;
    });

    // Calculate readiness score:
    // - 70% weight for required prerequisites
    // - 30% weight for recommended prerequisites
    let readinessScore = 0;

    if (requiredPrerequisites.length > 0) {
      const requiredScore =
        (completedRequiredPrerequisites.length / requiredPrerequisites.length) * 70;
      readinessScore += requiredScore;
    } else {
      // If no required prerequisites, award full 70%
      readinessScore += 70;
    }

    if (recommendedPrerequisites.length > 0) {
      const recommendedScore =
        (completedRecommendedPrerequisites.length / recommendedPrerequisites.length) * 30;
      readinessScore += recommendedScore;
    } else {
      // If no recommended prerequisites, award full 30%
      readinessScore += 30;
    }

    // Round to nearest integer
    readinessScore = Math.round(readinessScore);

    // Determine if prerequisites are satisfied
    // All required prerequisites must be completed
    const satisfied = missingRequiredPrerequisites.length === 0;

    return NextResponse.json({
      satisfied,
      requiredPrerequisites,
      recommendedPrerequisites,
      completedPrerequisites,
      completedRequiredPrerequisites,
      completedRecommendedPrerequisites,
      missingRequiredPrerequisites,
      readinessScore,
      prerequisitesCount: {
        required: requiredPrerequisites.length,
        recommended: recommendedPrerequisites.length,
        completedRequired: completedRequiredPrerequisites.length,
        completedRecommended: completedRecommendedPrerequisites.length,
      },
      lecture: {
        id: lecture.id,
        title: lecture.title,
        category: lecture.category
      }
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/prerequisites/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
