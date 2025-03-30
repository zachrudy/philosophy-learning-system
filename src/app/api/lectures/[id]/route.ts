// src/app/api/lectures/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LectureController } from '@/controllers/lectureController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';
import { UpdateLectureDTO } from '@/types/models';

/**
 * GET /api/lectures/:id
 * Fetches a specific lecture by its ID
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
    const includeEntities = searchParams.get('includeEntities') === 'true';
    const includePrerequisites = searchParams.get('includePrerequisites') === 'true';
    const includeProgress = searchParams.get('includeProgress') === 'true';
    const includeReflections = searchParams.get('includeReflections') === 'true';
    const deep = searchParams.get('deep') === 'true';

    // Call the controller method
    const result = await LectureController.getLectureById(id, {
      includeEntities,
      includePrerequisites,
      includeProgress,
      includeReflections,
      deep
    });

    // Return the appropriate response based on the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 404 }
      );
    }

    // Add this check for when result.success is true but data is missing
    if (!result.data) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lectures/:id
 * Updates an existing lecture
 * Requires admin or instructor role
 */
export async function PATCH(
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: UpdateLectureDTO;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Prevent empty updates
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Clean up the body to remove any fields that could cause Prisma validation errors
    const cleanBody = { ...body };
    if ('entities' in cleanBody) delete cleanBody.entities;
    if ('prerequisiteFor' in cleanBody) delete cleanBody.prerequisites;

    // Call the controller method to update the lecture
    const result = await LectureController.updateLecture(id, cleanBody);

    // Handle the result
    if (!result.success) {
      // If there are validation errors, return them with 400 status
      if (result.invalidFields) {
        return NextResponse.json(
          { error: result.error, invalidFields: result.invalidFields },
          { status: 400 }
        );
      }

      // For circular dependency errors, provide detailed information
      if (result.cycleDetails) {
        return NextResponse.json(
          {
            error: result.error,
            cycleDetails: result.cycleDetails
          },
          { status: 400 }
        );
      }

      // For other errors, use the provided status code or 500
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: 'Lecture updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in PATCH /api/lectures/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lectures/:id
 * Deletes a lecture
 * Requires admin role (more restrictive than creating/updating)
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

    // Check authorization based on database role - restrict to ADMIN only
    const userRole = user?.role;

    if (userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - only administrators can delete lectures' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    // Call the controller method to delete the lecture
    const result = await LectureController.deleteLecture(id);

    // Handle the result
    if (!result.success) {
      // For dependency errors, provide details about dependent lectures
      if (result.dependencies) {
        return NextResponse.json(
          {
            error: result.error,
            dependencies: result.dependencies
          },
          { status: 400 }
        );
      }

      // For other errors, use the provided status code or 500
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: result.message || 'Lecture deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
