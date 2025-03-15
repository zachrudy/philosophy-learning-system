// src/app/api/lectures/[id]/entity-relations/[relationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES, LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError
} from '@/lib/errors/appErrors';

/**
 * PATCH /api/lectures/:id/entity-relations/:relationId
 * Updates a specific entity relationship
 * Requires admin or instructor role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, relationId: string } }
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

    const { id: lectureId, relationId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    if (!relationId) {
      return NextResponse.json(
        { error: 'Relation ID is required' },
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

    // Prevent empty updates
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Verify the relationship exists and belongs to this lecture
    const existingRelation = await prisma.lectureEntityRelation.findUnique({
      where: { id: relationId }
    });

    if (!existingRelation) {
      return NextResponse.json(
        { error: 'Entity relationship not found' },
        { status: 404 }
      );
    }

    if (existingRelation.lectureId !== lectureId) {
      return NextResponse.json(
        { error: 'Entity relationship does not belong to the specified lecture' },
        { status: 403 }
      );
    }

    // Validate relationType if it's being updated
    if (body.relationType) {
      if (!Object.values(LECTURE_ENTITY_RELATION_TYPES).includes(body.relationType)) {
        return NextResponse.json(
          {
            error: `Invalid relation type: ${body.relationType}`,
            validTypes: Object.values(LECTURE_ENTITY_RELATION_TYPES)
          },
          { status: 400 }
        );
      }
    }

    // Update the relationship
    const updatedRelation = await prisma.lectureEntityRelation.update({
      where: { id: relationId },
      data: body,
      include: {
        entity: true
      }
    });

    // Return successful response
    return NextResponse.json({
      message: 'Entity relationship updated successfully',
      data: updatedRelation
    });
  } catch (error) {
    console.error('Error in PATCH /api/lectures/[id]/entity-relations/[relationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lectures/:id/entity-relations/:relationId
 * Removes a specific entity relationship
 * Requires admin or instructor role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, relationId: string } }
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

    const { id: lectureId, relationId } = params;

    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    if (!relationId) {
      return NextResponse.json(
        { error: 'Relation ID is required' },
        { status: 400 }
      );
    }

    // Verify the relationship exists and belongs to this lecture
    const existingRelation = await prisma.lectureEntityRelation.findUnique({
      where: { id: relationId }
    });

    if (!existingRelation) {
      return NextResponse.json(
        { error: 'Entity relationship not found' },
        { status: 404 }
      );
    }

    if (existingRelation.lectureId !== lectureId) {
      return NextResponse.json(
        { error: 'Entity relationship does not belong to the specified lecture' },
        { status: 403 }
      );
    }

    // Delete the relationship
    await prisma.lectureEntityRelation.delete({
      where: { id: relationId }
    });

    // Return successful response
    return NextResponse.json({
      message: 'Entity relationship removed successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[id]/entity-relations/[relationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
