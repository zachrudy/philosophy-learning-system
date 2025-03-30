// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { PROGRESS_STATUS } from '@/lib/constants';
import * as workflowUtils from '@/lib/utils/workflowUtils';

/**
 * POST /api/progress
 * Creates a new progress record for a user and lecture
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
    const { userId, lectureId, status = PROGRESS_STATUS.READY } = body;

    // Validate required fields
    if (!userId || !lectureId) {
      return NextResponse.json(
        { error: 'User ID and Lecture ID are required' },
        { status: 400 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId }
    });

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Check if a progress record already exists
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      }
    });

    if (existingProgress) {
      return NextResponse.json(
        { error: 'Progress record already exists for this user and lecture', existingId: existingProgress.id },
        { status: 409 }
      );
    }

    // Validate the status
    if (status && !Object.values(PROGRESS_STATUS).includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status value',
          validValues: Object.values(PROGRESS_STATUS)
        },
        { status: 400 }
      );
    }

    // Create the progress record
    const progress = await prisma.progress.create({
      data: {
        userId,
        lectureId,
        status: status || PROGRESS_STATUS.READY,
        decayFactor: 1.0 // Default value
      }
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/progress
 * Updates an existing progress record
 */
export async function PATCH(request: NextRequest) {
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
    const { userId, lectureId, status } = body;

    // Validate required fields
    if (!userId || !lectureId || !status) {
      return NextResponse.json(
        { error: 'User ID, Lecture ID, and status are required' },
        { status: 400 }
      );
    }

    // Validate the status
    if (!Object.values(PROGRESS_STATUS).includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status value',
          validValues: Object.values(PROGRESS_STATUS)
        },
        { status: 400 }
      );
    }

    // Find the existing progress record
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId,
        lectureId
      }
    });

    if (!existingProgress) {
      return NextResponse.json(
        { error: 'Progress record not found for this user and lecture' },
        { status: 404 }
      );
    }

    // Validate workflow transition
    const currentStatus = existingProgress.status;

    if (!workflowUtils.isValidTransition(currentStatus, status)) {
      return NextResponse.json({
        error: `Invalid workflow transition from '${currentStatus}' to '${status}'`,
        validTransitions: workflowUtils.getNextPossibleStatuses(currentStatus)
      }, { status: 400 });
    }

    // Create update data
    const updateData: any = {
      status
    };

    // If transitioning to MASTERED, set completedAt date
    if (status === PROGRESS_STATUS.MASTERED && existingProgress.status !== PROGRESS_STATUS.MASTERED) {
      updateData.completedAt = new Date();
    }

    // Always update lastViewed
    updateData.lastViewed = new Date();

    // Update the progress record
    const updatedProgress = await prisma.progress.update({
      where: { id: existingProgress.id },
      data: updateData
    });

    return NextResponse.json(updatedProgress);
  } catch (error) {
    console.error('Error in PATCH /api/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
