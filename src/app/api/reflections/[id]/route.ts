// src/app/api/reflections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { USER_ROLES } from '@/lib/constants';

/**
 * GET /api/reflections/[id]
 * Fetches a specific reflection by ID
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Reflection ID is required' },
        { status: 400 }
      );
    }

    // Get the reflection
    const reflection = await prisma.reflection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lecture: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    if (!reflection) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      );
    }

    // Check authorization - users can only see their own reflections unless they are admin/instructor
    const isOwnReflection = reflection.userId === session.user.id;
    const isAdminOrInstructor =
      session.user.role === USER_ROLES.ADMIN ||
      session.user.role === USER_ROLES.INSTRUCTOR;

    if (!isOwnReflection && !isAdminOrInstructor) {
      return NextResponse.json(
        { error: 'You can only access your own reflections' },
        { status: 403 }
      );
    }

    // Parse aiEvaluation JSON if it exists
    let parsedEvaluation = null;
    if (reflection.aiEvaluation) {
      try {
        parsedEvaluation = JSON.parse(reflection.aiEvaluation);
      } catch (error) {
        console.error('Error parsing AI evaluation:', error);
      }
    }

    // Return the reflection with parsed evaluation
    return NextResponse.json({
      ...reflection,
      parsedEvaluation,
    });
  } catch (error) {
    console.error('Error in GET /api/reflections/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  /**
   * PATCH /api/reflections/[id]
   * Updates a reflection, primarily for evaluation purposes
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

      const { id } = params;

      if (!id) {
        return NextResponse.json(
          { error: 'Reflection ID is required' },
          { status: 400 }
        );
      }

      // Get the existing reflection
      const existingReflection = await prisma.reflection.findUnique({
        where: { id },
      });

      if (!existingReflection) {
        return NextResponse.json(
          { error: 'Reflection not found' },
          { status: 404 }
        );
      }

      // Parse request body
      const body = await request.json();

      // Determine what can be updated based on user role and ownership
      const isOwnReflection = existingReflection.userId === session.user.id;
      const isAdminOrInstructor =
        session.user.role === USER_ROLES.ADMIN ||
        session.user.role === USER_ROLES.INSTRUCTOR;

      // Build update data based on permissions
      const updateData: any = {};

      // Content updates - only the owner can update the content
      if ('content' in body) {
        if (!isOwnReflection) {
          return NextResponse.json(
            { error: 'You can only update your own reflections' },
            { status: 403 }
          );
        }

        // Validate content is not empty
        if (!body.content || body.content.trim() === '') {
          return NextResponse.json(
            { error: 'Content cannot be empty' },
            { status: 400 }
          );
        }

        updateData.content = body.content;
      }

      // Evaluation updates - only admins/instructors can update these fields
      if (('aiEvaluation' in body || 'status' in body || 'score' in body) && !isAdminOrInstructor) {
        return NextResponse.json(
          { error: 'Only instructors and administrators can add evaluations' },
          { status: 403 }
        );
      }

      // Process evaluation-related fields if user is admin/instructor
      if (isAdminOrInstructor) {
        if ('status' in body) {
          updateData.status = body.status;
        }

        if ('score' in body) {
          // Validate score is a number between 0 and 100
          if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
            return NextResponse.json(
              { error: 'Score must be a number between 0 and 100' },
              { status: 400 }
            );
          }
          updateData.score = body.score;
        }

        if ('aiEvaluation' in body) {
          // Handle aiEvaluation - convert to string if needed
          if (typeof body.aiEvaluation === 'object') {
            updateData.aiEvaluation = JSON.stringify(body.aiEvaluation);
          } else if (typeof body.aiEvaluation === 'string') {
            // Verify it's valid JSON
            try {
              JSON.parse(body.aiEvaluation);
              updateData.aiEvaluation = body.aiEvaluation;
            } catch (error) {
              return NextResponse.json(
                { error: 'aiEvaluation must be valid JSON' },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'aiEvaluation must be a JSON object or string' },
              { status: 400 }
            );
          }
        }
      }

      // If no valid fields to update, return error
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        );
      }

      // Update the reflection
      const updatedReflection = await prisma.reflection.update({
        where: { id },
        data: updateData,
      });

      // Parse aiEvaluation JSON if it exists
      let parsedEvaluation = null;
      if (updatedReflection.aiEvaluation) {
        try {
          parsedEvaluation = JSON.parse(updatedReflection.aiEvaluation);
        } catch (error) {
          console.error('Error parsing AI evaluation:', error);
        }
      }

      // Return the updated reflection with parsed evaluation
      return NextResponse.json({
        ...updatedReflection,
        parsedEvaluation,
      });
    } catch (error) {
      console.error('Error in PATCH /api/reflections/[id]:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
