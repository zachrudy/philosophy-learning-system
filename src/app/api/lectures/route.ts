// src/app/api/lectures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LectureController } from '@/controllers/lectureController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';
import { CreateLectureDTO } from '@/types/models';

/**
 * GET /api/lectures
 * Fetches a list of lectures with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const lecturerName = searchParams.get('lecturerName') || undefined;
    const contentType = searchParams.get('contentType') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeEntities = searchParams.get('includeEntities') === 'true';
    const includePrerequisites = searchParams.get('includePrerequisites') === 'true';
    const deep = searchParams.get('deep') === 'true';

    // Parse pagination parameters with validation
    let page = 1;
    let limit = 10;

    const pageParam = searchParams.get('page');
    if (pageParam && !isNaN(Number(pageParam)) && Number(pageParam) > 0) {
      page = Number(pageParam);
    }

    const limitParam = searchParams.get('limit');
    if (limitParam && !isNaN(Number(limitParam)) && Number(limitParam) > 0) {
      limit = Math.min(Number(limitParam), 100); // Cap at 100 to prevent excessive queries
    }

    // Call the controller method
    const result = await LectureController.getAllLectures({
      category,
      lecturerName,
      contentType,
      search,
      page,
      limit,
      includeEntities,
      includePrerequisites,
      deep
    });

    // Return the appropriate response based on the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response with pagination data
    return NextResponse.json({
      data: result.data,
      pagination: result.metadata?.pagination,
      filters: result.metadata?.filters
    });
  } catch (error) {
    console.error('Error in GET /api/lectures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lectures
 * Creates a new lecture
 * Requires admin or instructor role
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: CreateLectureDTO;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Call the controller method to create the lecture
    const result = await LectureController.createLecture(body);

    // Handle the result
    if (!result.success) {
      // If there are validation errors, return them with 400 status
      if (result.invalidFields) {
        return NextResponse.json(
          { error: result.error, invalidFields: result.invalidFields },
          { status: 400 }
        );
      }

      // For other errors, use the provided status code or 500
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response with 201 Created status
    return NextResponse.json(
      {
        message: 'Lecture created successfully',
        data: result.data
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/lectures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
