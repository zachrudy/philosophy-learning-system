// src/app/api/lectures/[id]/entity-relations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LectureController } from '@/controllers/lectureController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES, LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';
import { LectureEntityRelationDTO } from '@/types/models';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError
} from '@/lib/errors/appErrors';

/**
 * GET /api/lectures/:id/entity-relations
 * Fetches all entity relationships for a specific lecture
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

    // Call the controller method to get entity relations
    const result = await LectureController.getLectureEntityRelations(id);

    // Handle the result
    if (!result.success) {
      // Return appropriate error response with status code
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 404 }
      );
    }

    // Return successful response with the data and any metadata
    return NextResponse.json({
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[id]/entity-relations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lectures/:id/entity-relations
 * Adds or updates entity relationships for a lecture
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

    // Validate that we have an array of entity relations
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of entity relations' },
        { status: 400 }
      );
    }

    // Validate each entity relation
    const entityRelations: LectureEntityRelationDTO[] = [];
    for (const [index, relation] of body.entries()) {
      if (!relation.entityId) {
        return NextResponse.json(
          { error: `Entity ID is required for relation at index ${index}` },
          { status: 400 }
        );
      }

      if (!relation.relationType) {
        return NextResponse.json(
          { error: `Relation type is required for relation at index ${index}` },
          { status: 400 }
        );
      }

      // Validate relation type
      if (!Object.values(LECTURE_ENTITY_RELATION_TYPES).includes(relation.relationType)) {
        return NextResponse.json(
          {
            error: `Invalid relation type '${relation.relationType}' for relation at index ${index}`,
            validTypes: Object.values(LECTURE_ENTITY_RELATION_TYPES)
          },
          { status: 400 }
        );
      }

      entityRelations.push({
        entityId: relation.entityId,
        relationType: relation.relationType,
        lectureId // Add the lecture ID from the route params
      });
    }

    // Call the controller method to update entity relationships
    const result = await LectureController.updateEntityRelationships(lectureId, entityRelations);

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

    // Return successful response with 201 Created
    return NextResponse.json({
      message: 'Entity relationships updated successfully',
      data: result.data
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lectures/[id]/entity-relations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lectures/:id/entity-relations
 * Removes entity relationships from a lecture
 * Can remove a specific relationship or all relationships
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

    // Check if we're deleting a specific relationship or all relationships
    const searchParams = request.nextUrl.searchParams;
    const relationId = searchParams.get('relationId');

    let result;

    if (relationId) {
      // Delete a specific relationship
      // First verify the relationship exists and belongs to this lecture
      const relation = await prisma.lectureEntityRelation.findUnique({
        where: { id: relationId },
        select: { lectureId: true }
      });

      if (!relation) {
        return NextResponse.json(
          { error: 'Entity relationship not found' },
          { status: 404 }
        );
      }

      if (relation.lectureId !== lectureId) {
        return NextResponse.json(
          { error: 'Entity relationship does not belong to the specified lecture' },
          { status: 403 }
        );
      }

      // Delete the specific relationship
      await prisma.lectureEntityRelation.delete({
        where: { id: relationId }
      });

      result = {
        success: true,
        message: 'Entity relationship removed successfully'
      };
    } else {
      // Delete all relationships for the lecture by passing an empty array
      // This will delete all existing relationships and not create any new ones
      result = await LectureController.updateEntityRelationships(lectureId, []);
    }

    // Handle the result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: result.message || 'Entity relationships removed successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[id]/entity-relations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
