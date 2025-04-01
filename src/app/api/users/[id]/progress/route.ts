// src/app/api/users/[id]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ProgressController } from '@/controllers/progressController';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';

/**
 * NOTE FOR FUTURE DEVELOPMENT:
 * This is a minimal implementation to support the lecture module's needs.
 *
 * These endpoints will be expanded during the Student Module implementation phase to support:
 * 1. Creating and updating progress records
 * 2. Tracking detailed learning progression
 * 3. Supporting the knowledge decay model
 * 4. Generating learning recommendations
 *
 * For now, this only implements read functionality needed for prerequisite checking
 * and basic progress display.
 */

/**
 * GET /api/users/[id]/progress
 * Get all progress for a specific user
 */
 export async function GET(
   request: NextRequest,
   { params }: { params: { id: string } }
 ) {
   try {
     // Get the user ID from the route parameters
     const { id: userId } = params;

     console.log(`GET /api/users/${userId}/progress called`);

     if (!userId || userId === 'undefined') {
       return NextResponse.json(
         { error: 'Valid user ID is required' },
         { status: 400 }
       );
     }

     // Check authentication
     const session = await getServerSession();

     console.log('Session:', session?.user);
     console.log('Requested userId:', userId);

     if (!session || !session.user) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       );
     }

     // Check if the user is requesting their own progress or is an admin/instructor
     // The issue might be here - the session.user.id might be different from userId
     // Let's loosen this check for debugging purposes
     const isRequestingOwnProgress = session.user.id === userId;
     const isAdminOrInstructor =
       session.user.role === USER_ROLES.ADMIN ||
       session.user.role === USER_ROLES.INSTRUCTOR;

     console.log('Is requesting own progress:', isRequestingOwnProgress);
     console.log('Is admin or instructor:', isAdminOrInstructor);

     // Temporarily allow all authenticated users to access progress for debugging
     // Comment this part out when the issue is resolved

     if (!isRequestingOwnProgress && !isAdminOrInstructor) {
       return NextResponse.json(
         { error: 'Forbidden - you can only access your own progress' },
         { status: 403 }
       );
     }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lectureId = searchParams.get('lectureId');

    let result;

    if (lectureId) {
      // Get progress for a specific lecture
      result = await ProgressController.getProgressForLecture(userId, lectureId);
    } else {
      // Get all progress for the user
      result = await ProgressController.getAllProgressForUser(userId);
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
    console.error('Error in GET /api/users/[id]/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
