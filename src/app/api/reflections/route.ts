// src/app/api/reflections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { PROMPT_TYPES } from '@/lib/constants';

/**
 * POST /api/reflections
 * Creates a new reflection
 */
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

    // Parse request body
    const body = await request.json();
    const { lectureId, promptType, content } = body;

    // Validate required fields
    if (!lectureId) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      );
    }

    if (!promptType) {
      return NextResponse.json(
        { error: 'Prompt type is required' },
        { status: 400 }
      );
    }

    // Validate prompt type is one of the allowed values
    const validPromptTypes = Object.values(PROMPT_TYPES);
    if (!validPromptTypes.includes(promptType)) {
      return NextResponse.json(
        {
          error: `Invalid prompt type. Must be one of: ${validPromptTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Validate minimum word count based on prompt type
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    let minWordCount = 0;
    switch (promptType) {
      case PROMPT_TYPES.PRE_LECTURE:
      case PROMPT_TYPES.INITIAL:
        minWordCount = 30;
        break;
      case PROMPT_TYPES.MASTERY:
        minWordCount = 50;
        break;
      // No minimum for discussion prompts
    }

    if (wordCount < minWordCount && minWordCount > 0) {
      return NextResponse.json(
        { error: `Reflection must be at least ${minWordCount} words` },
        { status: 400 }
      );
    }

    // Verify lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Create the reflection
    const reflection = await prisma.reflection.create({
      data: {
        userId: session.user.id,
        lectureId,
        promptType,
        content,
        status: 'SUBMITTED', // Default status
      },
    });

    return NextResponse.json(reflection, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reflections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
