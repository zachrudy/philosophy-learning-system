// src/app/api/philosophical-entities/[id]/learning-path/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';

// GET /api/philosophical-entities/:id/learning-path
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

    // Get learning path for the target concept
    const result = await PhilosophicalEntityController.getLearningPath(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Entity not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/philosophical-entities/[id]/learning-path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
