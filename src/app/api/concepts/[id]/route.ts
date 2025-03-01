import { NextRequest, NextResponse } from 'next/server';
import { ConceptController } from '@/controllers/conceptController';

// GET /api/concepts/:id
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'Concept ID is required' },
      { status: 400 }
    );
  }

  const result = await ConceptController.getConceptById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Concept not found' ? 404 : 500 }
    );
  }

  return NextResponse.json(result.data);
}

// PATCH /api/concepts/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Concept ID is required' },
        { status: 400 }
      );
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    const result = await ConceptController.updateConcept(id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Concept not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PATCH /api/concepts/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/concepts/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Concept ID is required' },
        { status: 400 }
      );
    }

    const result = await ConceptController.deleteConcept(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Concept not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/concepts/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
