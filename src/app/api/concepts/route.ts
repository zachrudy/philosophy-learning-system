import { NextRequest, NextResponse } from 'next/server';
import { ConceptController } from '@/controllers/conceptController';
import { CreateConceptDTO } from '@/types/models';

// GET /api/concepts
export async function GET() {
  const result = await ConceptController.getAllConcepts();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

// POST /api/concepts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const conceptData: CreateConceptDTO = {
      name: body.name,
      description: body.description,
      prerequisiteIds: body.prerequisiteIds || [],
    };

    const result = await ConceptController.createConcept(conceptData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/concepts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
