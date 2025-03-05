// src/app/api/philosophical-relationships/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';

// PATCH /api/philosophical-relationships/:id
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

    // Check authorization - only admin and instructors can update relationships
    const userRole = session.user.role;
    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Relationship ID is required' },
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

    // Prevent empty update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Update the relationship
    const result = await PhilosophicalRelationController.updateRelationship(id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Relationship not found' ? 404 : 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PATCH /api/philosophical-relationships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/philosophical-relationships/:id
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

    // Check authorization - only admin and instructors can delete relationships
    const userRole = session.user.role;
    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Relationship ID is required' },
        { status: 400 }
      );
    }

    // Delete the relationship
    const result = await PhilosophicalRelationController.deleteRelationship(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Relationship not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error in DELETE /api/philosophical-relationships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
