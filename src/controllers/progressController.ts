// src/controllers/progressController.ts

import { prisma } from '@/lib/db/prisma';
import { PROGRESS_STATUS } from '@/lib/constants';
import { Progress } from '@prisma/client';
import {
  AppError,
  NotFoundError,
  ValidationError,
  DatabaseError
} from '@/lib/errors/appErrors';
import { successResponse, errorResponse } from '@/lib/utils/responseUtils';
import { transformProgress } from '@/lib/transforms';

/**
 * Controller for managing user progress on lectures
 *
 * NOTE FOR FUTURE DEVELOPMENT:
 * This is a minimal implementation to support the lecture module's needs.
 * This controller will be significantly expanded during the Student Module
 * implementation phase to include:
 *
 * 1. Full CRUD operations for progress records
 * 2. Methods to update progress as students move through the lecture workflow
 * 3. Knowledge decay model integration
 * 4. Progress statistics and reporting functions
 * 5. Learning path recommendation based on progress
 *
 * For now, this controller only implements the read methods needed for
 * prerequisite checking and basic progress display.
 */
export class ProgressController {
  /**
   * Get a user's progress for a specific lecture
   */
  static async getProgressForLecture(userId: string, lectureId: string) {
    try {
      // Validate inputs
      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      if (!lectureId) {
        throw new ValidationError('Lecture ID is required');
      }

      // Get the progress record
      const progress = await prisma.progress.findUnique({
        where: {
          userId_lectureId: {
            userId,
            lectureId
          }
        }
      });

      // Transform the progress data
      const transformedProgress = transformProgress(progress);

      // Return the result
      return successResponse(transformedProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      return errorResponse(error);
    }
  }

  /**
   * Get all progress records for a user
   */
  static async getAllProgressForUser(userId: string) {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true } // Only select ID to optimize query
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Get all progress records for the user
      const progressRecords = await prisma.progress.findMany({
        where: { userId },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ],
        include: {
          lecture: {
            select: {
              id: true,
              title: true,
              category: true,
              order: true
            }
          }
        }
      });

      // Transform the progress records
      const transformedRecords = progressRecords.map(record => ({
        ...transformProgress(record),
        lecture: record.lecture
      }));

      // Return the result with useful metadata
      return successResponse(transformedRecords, null, {
        userId,
        totalCount: transformedRecords.length,
        completedCount: transformedRecords.filter(r => r.status === PROGRESS_STATUS.MASTERED).length,
        inProgressCount: transformedRecords.filter(r =>
          r.status !== PROGRESS_STATUS.LOCKED &&
          r.status !== PROGRESS_STATUS.MASTERED
        ).length
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return errorResponse(error);
    }
  }

  /**
   * Get all progress records for a lecture
   */
  static async getAllProgressForLecture(lectureId: string) {
    try {
      // Validate input
      if (!lectureId) {
        throw new ValidationError('Lecture ID is required');
      }

      // Check if lecture exists using the LectureController helper
      const { LectureController } = await import('./lectureController');
      const lectureExists = await LectureController.lectureExists(lectureId);

      if (!lectureExists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      // Get all progress records for the lecture
      const progressRecords = await prisma.progress.findMany({
        where: { lectureId },
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Transform the progress records
      const transformedRecords = progressRecords.map(record => ({
        ...transformProgress(record),
        user: record.user
      }));

      // Return the result with useful metadata
      return successResponse(transformedRecords, null, {
        lectureId,
        totalCount: transformedRecords.length,
        byStatus: {
          mastered: transformedRecords.filter(r => r.status === PROGRESS_STATUS.MASTERED).length,
          locked: transformedRecords.filter(r => r.status === PROGRESS_STATUS.LOCKED).length,
          inProgress: transformedRecords.filter(r =>
            r.status !== PROGRESS_STATUS.LOCKED &&
            r.status !== PROGRESS_STATUS.MASTERED
          ).length
        }
      });
    } catch (error) {
      console.error('Error fetching lecture progress:', error);
      return errorResponse(error);
    }
  }

  /**
   * Utility method to check if a user has completed a lecture
   * This is used for prerequisite checking
   */
  static async hasUserCompletedLecture(userId: string, lectureId: string): Promise<boolean> {
    try {
      const progress = await prisma.progress.findUnique({
        where: {
          userId_lectureId: {
            userId,
            lectureId
          }
        },
        select: { status: true }
      });

      return progress?.status === PROGRESS_STATUS.MASTERED;
    } catch (error) {
      console.error('Error checking lecture completion:', error);
      return false;
    }
  }

  /**
   * Get the completion status of a lecture for a user
   * Returns more detailed information than the hasUserCompletedLecture method
   */
  static async getLectureCompletionStatus(userId: string, lectureId: string) {
    try {
      // Validate inputs
      if (!userId || !lectureId) {
        throw new ValidationError(
          'Both user ID and lecture ID are required',
          {
            userId: !userId ? 'User ID is required' : undefined,
            lectureId: !lectureId ? 'Lecture ID is required' : undefined
          }
        );
      }

      // Get the progress record
      const progress = await prisma.progress.findUnique({
        where: {
          userId_lectureId: {
            userId,
            lectureId
          }
        }
      });

      // If no progress record exists, return a default status
      if (!progress) {
        return successResponse({
          exists: false,
          status: PROGRESS_STATUS.LOCKED,
          isCompleted: false,
          isInProgress: false,
          lastViewed: null,
          completedAt: null
        });
      }

      // Return the status with useful derived information
      return successResponse({
        exists: true,
        status: progress.status,
        isCompleted: progress.status === PROGRESS_STATUS.MASTERED,
        isInProgress: progress.status !== PROGRESS_STATUS.LOCKED &&
                     progress.status !== PROGRESS_STATUS.MASTERED,
        lastViewed: progress.lastViewed,
        completedAt: progress.completedAt,
        updatedAt: progress.updatedAt
      });
    } catch (error) {
      console.error('Error getting lecture completion status:', error);
      return errorResponse(error);
    }
  }

  // More methods will be added during the Student Module implementation
}
