// src/app/api/philosophical-entities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';


// GET /api/philosophical-entities
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    // Parse and validate numeric parameters
    let page = 1;
    let limit = 10;

    const pageParam = searchParams.get('page');
    if (pageParam && !isNaN(Number(pageParam)) && Number(pageParam) > 0) {
      page = Number(pageParam);
    }

    const limitParam = searchParams.get('limit');
    if (limitParam && !isNaN(Number(limitParam)) && Number(limitParam) > 0) {
      limit = Number(limitParam);
    }

    // Query entities with filters and pagination
    const result = await PhilosophicalEntityController.getAllEntities({
      type,
      search,
      page,
      limit
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return the data and pagination information directly from the controller
    return NextResponse.json({
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in GET /api/philosophical-entities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/philosophical-entities
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

    // Check authorization - only admin and instructors can create entities
    const userRole = session.user.role;
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
    if (!body.type || !body.name || !body.description) {
      return NextResponse.json(
        { error: 'Type, name, and description are required fields' },
        { status: 400 }
      );
    }

    // Create the entity
    const result = await PhilosophicalEntityController.createEntity(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/philosophical-entities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
