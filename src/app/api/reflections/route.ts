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
    console.log("POST /api/reflections called");

    // Check authentication
    const session = await getServerSession();
    console.log("Session:", JSON.stringify(session));

    if (!session || !session.user) {
      console.log("No session or user found");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user email from session
    const userEmail = session.user.email;
    console.log("User email from session:", userEmail);

    if (!userEmail) {
      console.log("No user email in session");
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    console.log("User found:", user);

    if (!user) {
      console.log("No user found for email:", userEmail);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    console.log("User ID:", userId);

    // Parse request body
    const body = await request.json();
    const { lectureId, promptType, content } = body;
    console.log("Request body:", { lectureId, promptType, content: content?.substring(0, 50) + "..." });

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

    // Create the reflection with a direct relationship
    try {
      console.log("Creating reflection with userId:", userId);

      // Method 1: Using userId directly
      /*
      const reflection = await prisma.reflection.create({
        data: {
          userId,
          lectureId,
          promptType,
          content,
          status: 'SUBMITTED',
        },
      });
      */

      // Method 2: Using direct relationship
      const reflection = await prisma.reflection.create({
        data: {
          user: {
            connect: { id: userId }
          },
          lecture: {
            connect: { id: lectureId }
          },
          promptType,
          content,
          status: 'SUBMITTED',
        },
      });

      console.log("Reflection created successfully:", reflection.id);
      return NextResponse.json(reflection, { status: 201 });
    } catch (prismaError) {
      console.error('Prisma error creating reflection:', prismaError);
      return NextResponse.json(
        {
          error: 'Failed to create reflection',
          details: JSON.stringify(prismaError, null, 2)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/reflections:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
