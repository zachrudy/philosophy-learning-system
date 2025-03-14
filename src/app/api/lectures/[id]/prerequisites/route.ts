// src/app/api/lectures/[id]/prerequisites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LecturePrerequisiteController } from '@/controllers/lecturePrerequisiteController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';
import { LecturePrerequisiteDTO } from '@/types/models';

/**
 * GET /api/lectures/:id/prerequisites
 * Fetches all prerequisites for a specific lecture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Parse query parameters for optional includes
    const searchParams = request.nextUrl.searchParams;
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Call the controller method
    const result = await LecturePrerequisiteController.getPrerequisitesForLecture(id, {
      includeDetails
    });

    // Return the appropriate response based on the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 404 }
      );
    }

    // Return successful response
    return NextResponse.json({
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/prerequisites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lectures/:id/prerequisites
 * Adds a new prerequisite to a lecture
 * Requires admin or instructor role
 */
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

    // Get user role directly from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    // Check authorization based on database role
    const userRole = user?.role;

    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: lectureId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Ensure prerequisite lecture ID is provided
    if (!body.prerequisiteLectureId) {
      return NextResponse.json(
        { error: 'Prerequisite lecture ID is required' },
        { status: 400 }
      );
    }

    // Prepare the prerequisite data
    const prerequisiteData: LecturePrerequisiteDTO = {
      lectureId,
      prerequisiteLectureId: body.prerequisiteLectureId,
      isRequired: body.isRequired !== undefined ? body.isRequired : true,
      importanceLevel: body.importanceLevel || 3
    };

    // Call the controller method to add the prerequisite
    const result = await LecturePrerequisiteController.addPrerequisite(prerequisiteData);

    // Handle the result
    if (!result.success) {
      // Special handling for circular dependency errors
      if (result.cycleDetails) {
        return NextResponse.json({
          error: result.error,
          cycleDetails: result.cycleDetails
        }, { status: 400 });
      }

      // Handle conflict errors (duplicate prerequisites)
      if (result.error?.includes('already exists') && result.existingId) {
        return NextResponse.json({
          error: result.error,
          existingId: result.existingId
        }, { status: 409 });
      }

      // For other errors, use the provided status code or 500
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response with 201 Created
    return NextResponse.json({
      message: 'Prerequisite added successfully',
      data: result.data
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lectures/[id]/prerequisites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lectures/:id/prerequisites
 * Removes a prerequisite from a lecture
 * The prerequisite ID must be provided as a query parameter
 * Requires admin or instructor role
 */
export async function DELETE(
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

    // Get user role directly from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    // Check authorization based on database role
    const userRole = user?.role;

    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: lectureId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Get the prerequisite ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const prerequisiteId = searchParams.get('prerequisiteId');

    if (!prerequisiteId) {
      return NextResponse.json(
        { error: 'Prerequisite ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Call the controller method to remove the prerequisite
    const result = await LecturePrerequisiteController.removePrerequisite(prerequisiteId);

    // Handle the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 404 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: result.message || 'Prerequisite removed successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[id]/prerequisites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
