// src/app/api/philosophical-entities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db/prisma';

// GET /api/philosophical-entities/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // Check if we need to return a learning path instead
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith('/learning-path')) {
      const result = await PhilosophicalEntityController.getLearningPath(id);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Entity not found' ? 404 : 500 }
        );
      }

      return NextResponse.json(result.data);
    }

    // Get the entity by ID
    const result = await PhilosophicalEntityController.getEntityById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Entity not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/philosophical-entities/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/philosophical-entities/:id
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

    // Look up the user's role from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    // Check authorization based on the role from the database
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
        { error: 'Entity ID is required' },
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

    // Update the entity
    const result = await PhilosophicalEntityController.updateEntity(id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Entity not found' ? 404 : 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PATCH /api/philosophical-entities/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/philosophical-entities/:id
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

    // Look up the user's role from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    // Check authorization based on the role from the database
    const userRole = user?.role;

    if (userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // Delete the entity
    const result = await PhilosophicalEntityController.deleteEntity(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Entity not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error in DELETE /api/philosophical-entities/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
