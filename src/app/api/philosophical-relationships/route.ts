// src/app/api/philosophical-relationships/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';

// POST /api/philosophical-relationships
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
    console.log('User role from DB lookup:', userRole);

    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
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

    // Validate required fields
    if (!body.sourceEntityId || !body.targetEntityId || !body.relationTypes || !Array.isArray(body.relationTypes) || body.relationTypes.length === 0) {
      return NextResponse.json(
        { error: 'sourceEntityId, targetEntityId, and relationTypes (as a non-empty array) are required' },
        { status: 400 }
      );
    }

    // Create the relationship
    const result = await PhilosophicalRelationController.createRelationship(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/philosophical-relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
