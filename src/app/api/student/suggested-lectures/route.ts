// src/app/api/student/suggested-lectures/route.ts
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
    const limit = Number(searchParams.get('limit')) || 5; // Default to 5 suggestions
    const category = searchParams.get('category');

    // Get user's progress records
    const progressRecords = await prisma.progress.findMany({
      where: { userId },
    });

    // Get completed lecture IDs
    const completedLectureIds = progressRecords
      .filter(p => p.status === PROGRESS_STATUS.MASTERED)
      .map(p => p.lectureId);

    // Get in-progress lecture IDs (these should be suggested first)
    const inProgressLectureIds = progressRecords
      .filter(p =>
        p.status !== PROGRESS_STATUS.MASTERED &&
        p.status !== PROGRESS_STATUS.LOCKED
      )
      .map(p => p.lectureId);

    // Get all lectures
    const lectures = await prisma.lecture.findMany({
      where: category ? { category } : {},
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ],
    });

    // Prioritize lectures:
    // 1. In-progress lectures
    // 2. Available lectures (prerequisites satisfied but not started)
    // 3. Next logical lectures based on order
    let suggestedLectures = [];

    // First, add in-progress lectures
    const inProgressLectures = lectures.filter(lecture =>
      inProgressLectureIds.includes(lecture.id)
    );

    suggestedLectures.push(...inProgressLectures);

    // Next, find available lectures (where all required prerequisites are completed)
    for (const lecture of lectures) {
      // Skip if already in suggestions or completed
      if (
        suggestedLectures.some(l => l.id === lecture.id) ||
        completedLectureIds.includes(lecture.id)
      ) {
        continue;
      }

      // Get prerequisites for this lecture
      const prerequisites = await prisma.lecturePrerequisite.findMany({
        where: { lectureId: lecture.id },
      });

      // If no prerequisites, it's available
      if (prerequisites.length === 0) {
        suggestedLectures.push(lecture);
        continue;
      }

      // Check if required prerequisites are satisfied
      const requiredPrereqs = prerequisites.filter(p => p.isRequired);
      const requiredCompleted = requiredPrereqs.every(p =>
        completedLectureIds.includes(p.prerequisiteLectureId)
      );

      if (requiredCompleted) {
        suggestedLectures.push(lecture);
      }
    }

    // Trim to requested limit
    suggestedLectures = suggestedLectures.slice(0, limit);

    // Format response with additional information
    const suggestedWithStatus = await Promise.all(suggestedLectures.map(async (lecture) => {
      const progress = progressRecords.find(p => p.lectureId === lecture.id);

      // Calculate readiness score
      const prerequisites = await prisma.lecturePrerequisite.findMany({
        where: { lectureId: lecture.id },
      });

      let readinessScore = 100;

      if (prerequisites.length > 0) {
        const requiredPrereqs = prerequisites.filter(p => p.isRequired);
        const recommendedPrereqs = prerequisites.filter(p => !p.isRequired);

        const completedRequiredCount = requiredPrereqs.filter(p =>
          completedLectureIds.includes(p.prerequisiteLectureId)
        ).length;

        const completedRecommendedCount = recommendedPrereqs.filter(p =>
          completedLectureIds.includes(p.prerequisiteLectureId)
        ).length;

        // Required prerequisites: 70% of score, Recommended: 30% of score
        const requiredScore = requiredPrereqs.length > 0
          ? (completedRequiredCount / requiredPrereqs.length) * 70
          : 70;

        const recommendedScore = recommendedPrereqs.length > 0
          ? (completedRecommendedCount / recommendedPrereqs.length) * 30
          : 30;

        readinessScore = Math.min(100, Math.round(requiredScore + recommendedScore));
      }

      let status = progress?.status || PROGRESS_STATUS.READY;
      let isCompleted = status === PROGRESS_STATUS.MASTERED;
      let isInProgress = [
        PROGRESS_STATUS.STARTED,
        PROGRESS_STATUS.WATCHED,
        PROGRESS_STATUS.INITIAL_REFLECTION,
        PROGRESS_STATUS.MASTERY_TESTING
      ].includes(status);
      let isAvailable = status === PROGRESS_STATUS.READY;

      return {
        lecture,
        status,
        isCompleted,
        isInProgress,
        isAvailable,
        readinessScore,
        prerequisitesSatisfied: true // Since we only include lectures where prerequisites are satisfied
      };
    }));

    return NextResponse.json({
      data: suggestedWithStatus,
      metadata: {
        total: suggestedWithStatus.length,
        limit,
        inProgressCount: suggestedWithStatus.filter(item => item.isInProgress).length,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Error in GET /api/student/suggested-lectures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
