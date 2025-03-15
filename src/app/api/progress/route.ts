// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ProgressController } from '@/controllers/progressController';

/**
 * NOTE FOR FUTURE DEVELOPMENT:
 * This is a minimal implementation of the progress API to support the lecture module's needs.
 *
 * These endpoints will be expanded during the Student Module implementation phase to include:
 * 1. POST endpoint to create new progress records
 * 2. PATCH endpoint to update progress as students work through lectures
 * 3. DELETE endpoint (if needed) for administrative purposes
 * 4. Additional query parameters for filtering and pagination
 * 5. Integration with knowledge decay model and learning recommendations
 *
 * For now, this only implements the read methods needed for prerequisite checking
 * and basic progress display.
 */

/**
 * GET /api/progress
 * Get progress records with optional filtering
 */
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const lectureId = searchParams.get('lectureId');

    let result;

    // Choose the appropriate controller method based on the parameters
    if (userId && lectureId) {
      // Get progress for a specific user and lecture
      result = await ProgressController.getProgressForLecture(userId, lectureId);
    } else if (userId) {
      // Get all progress for a user
      result = await ProgressController.getAllProgressForUser(userId);
    } else if (lectureId) {
      // Get all progress for a lecture
      result = await ProgressController.getAllProgressForLecture(lectureId);
    } else {
      // No filtering parameters - this requires admin access
      // Check if user is admin before proceeding
      // This endpoint should be paginated and we'll implement it in the student module
      return NextResponse.json(
        { error: 'Either userId or lectureId parameter is required' },
        { status: 400 }
      );
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
    console.error('Error in GET /api/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
