// src/app/api/lectures/[id]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ProgressController } from '@/controllers/progressController';
import { LectureController } from '@/controllers/lectureController';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';

/**
 * NOTE FOR FUTURE DEVELOPMENT:
 * This is a minimal implementation to support the lecture module's needs.
 *
 * This endpoint will be expanded during the Student Module implementation to support:
 * 1. Creating and updating progress records via POST/PATCH methods
 * 2. Detailed progress analytics for instructors
 * 3. Tracking student progression through the lecture workflow
 *
 * For now, this only implements basic read functionality needed for
 * prerequisite checking and progress display in the admin interface.
 */

/**
 * GET /api/lectures/[id]/progress
 * Get all progress records for a specific lecture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the lecture ID from the route parameters
    const { id: lectureId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify lecture exists
    const lectureExists = await LectureController.lectureExists(lectureId);
    if (!lectureExists) {
      return NextResponse.json(
        { error: `Lecture with ID ${lectureId} not found` },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let result;

    if (userId) {
      // If userId is provided and it matches the current user or the user is an admin/instructor
      if (
        userId === session.user.id ||
        session.user.role === USER_ROLES.ADMIN ||
        session.user.role === USER_ROLES.INSTRUCTOR
      ) {
        // Get progress for the specific user and lecture
        result = await ProgressController.getProgressForLecture(userId, lectureId);
      } else {
        // User is trying to access someone else's progress
        return NextResponse.json(
          { error: 'Forbidden - you can only access your own progress' },
          { status: 403 }
        );
      }
    } else {
      // Getting all progress records for a lecture requires admin/instructor role
      if (
        session.user.role !== USER_ROLES.ADMIN &&
        session.user.role !== USER_ROLES.INSTRUCTOR
      ) {
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions' },
          { status: 403 }
        );
      }

      // Get all progress records for the lecture
      result = await ProgressController.getAllProgressForLecture(lectureId);
    }

    // Return the appropriate response based on the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response with any metadata
    return NextResponse.json({
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
