// src/app/api/philosophical-entities/[id]/relationships/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';

// GET /api/philosophical-entities/:id/relationships
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

    // Get relationships for the entity
    const result = await PhilosophicalEntityController.getRelationshipsByEntityId(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Entity not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/philosophical-entities/[id]/relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
