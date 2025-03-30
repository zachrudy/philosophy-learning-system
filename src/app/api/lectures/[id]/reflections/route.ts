// src/app/api/lectures/[id]/reflections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { USER_ROLES } from '@/lib/constants';

/**
 * GET /api/lectures/[id]/reflections
 * Fetches all reflections for a lecture
 */
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

    // Verify lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const promptType = searchParams.get('promptType');

    // Build the base query
    const whereClause: any = {
      lectureId,
    };

    // If userId is provided, add it to the query
    if (userId) {
      // Check if user is requesting their own reflections or is an admin/instructor
      const isOwnReflections = userId === session.user.id;
      const isAdminOrInstructor =
        session.user.role === USER_ROLES.ADMIN ||
        session.user.role === USER_ROLES.INSTRUCTOR;

      if (!isOwnReflections && !isAdminOrInstructor) {
        return NextResponse.json(
          { error: 'You can only access your own reflections' },
          { status: 403 }
        );
      }

      whereClause.userId = userId;
    } else {
      // If no userId is provided, instructors/admins can see all, students can only see their own
      const isAdminOrInstructor =
        session.user.role === USER_ROLES.ADMIN ||
        session.user.role === USER_ROLES.INSTRUCTOR;

      if (!isAdminOrInstructor) {
        whereClause.userId = session.user.id;
      }
    }

    // If promptType is provided, add it to the query
    if (promptType) {
      whereClause.promptType = promptType;
    }

    // Get reflections
    const reflections = await prisma.reflection.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Parse aiEvaluation JSON for each reflection
    const transformedReflections = reflections.map(reflection => {
      let parsedEvaluation = null;

      if (reflection.aiEvaluation) {
        try {
          parsedEvaluation = JSON.parse(reflection.aiEvaluation);
        } catch (error) {
          console.error('Error parsing AI evaluation:', error);
        }
      }

      return {
        ...reflection,
        parsedEvaluation,
      };
    });

    return NextResponse.json({
      data: transformedReflections,
      metadata: {
        lectureId,
        count: transformedReflections.length,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/reflections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
