// src/controllers/lecturePrerequisiteController.ts

import { PrismaClient, Lecture, Progress, LecturePrerequisite } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  PROGRESS_STATUS,
  ProgressStatus
} from '@/lib/constants';
import {
  LecturePrerequisiteDTO,
  LectureWithRelations,
  UserWithProgress
} from '@/types/models';
import { validatePrerequisite } from '@/lib/validation/prerequisiteValidation';
// Import the LectureController to use the lectureExists helper
import { LectureController } from './lectureController';

// Import error classes
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  CircularDependencyError,
  DatabaseError
} from '@/lib/errors/appErrors';

// Import transformation functions
import {
  transformLecture,
  transformLectureWithRelations,
  transformLecturePrerequisite,
  transformPrerequisiteCheckResult,
  transformLectureAvailability,
  createApiResponse,
  createPaginatedResponse,
  transformArray,
  createTransformedResponse
} from '@/lib/transforms';


/**
 * Controller for managing lecture prerequisites
 */
export class LecturePrerequisiteController {
  /**
   * Get all prerequisites for a lecture
   */
  static async getPrerequisitesForLecture(lectureId: string, options: {
    includeDetails?: boolean;
  } = {}) {
    try {
      const { includeDetails = false } = options;

      // Use LectureController.lectureExists helper
      const exists = await LectureController.lectureExists(lectureId);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      // Get prerequisites with optional details
      const prerequisites = await prisma.lecturePrerequisite.findMany({
        where: { lectureId },
        include: {
          prerequisiteLecture: includeDetails
        },
        orderBy: [
          { isRequired: 'desc' },
          { importanceLevel: 'desc' }
        ]
      });

      // Transform the prerequisites
      const transformedPrerequisites = transformArray(prerequisites, transformLecturePrerequisite);

      return {
        success: true,
        data: transformedPrerequisites
      };
    } catch (error) {
      console.error('Error fetching prerequisites:', error);

      // Preserve the specific error types
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };
      }

      // Generic database error
      return {
        success: false,
        error: `Failed to fetch prerequisites: ${error.message}`
      };
    }
  }

  /**
   * Get all lectures that have the specified lecture as a prerequisite
   */
  static async getLecturesRequiringPrerequisite(prerequisiteId: string, options: {
    includeDetails?: boolean;
  } = {}) {
    try {
      const { includeDetails = false } = options;

      // Use LectureController.lectureExists helper
      const exists = await LectureController.lectureExists(prerequisiteId);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${prerequisiteId} not found`);
      }

      // Get lectures that have this prerequisite
      const dependentLectures = await prisma.lecturePrerequisite.findMany({
        where: { prerequisiteLectureId: prerequisiteId },
        include: {
          lecture: includeDetails
        }
      });

      // Transform the dependent lectures
      const transformedDependentLectures = transformArray(dependentLectures, (prereq) => {
        const transformed = { ...prereq };
        if (prereq.lecture) {
          transformed.lecture = transformLecture(prereq.lecture);
        }
        return transformed;
      });

      return {
        success: true,
        data: transformedDependentLectures
      };
    } catch (error) {
      console.error('Error fetching dependent lectures:', error);

      // Preserve the specific error types
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };
      }

      // Generic error
      return {
        success: false,
        error: `Failed to fetch dependent lectures: ${error.message}`
      };
    }
  }

  /**
   * Validates prerequisite data
   */
  static validatePrerequisiteData(data: Partial<LecturePrerequisiteDTO>, isUpdate = false): {
    valid: boolean;
    errors: string[];
    sanitizedData?: Partial<LecturePrerequisiteDTO>;
  } {
    return validatePrerequisite(data, isUpdate);
  }

  /**
   * Add a prerequisite to a lecture
   */
  static async addPrerequisite(data: LecturePrerequisiteDTO) {
    try {
      // Validate the prerequisite data
      const validation = this.validatePrerequisiteData(data);
      if (!validation.valid) {
        throw new ValidationError(
          `Validation failed: ${validation.errors.join(', ')}`,
          // Create a map of invalid fields for the validation error
          validation.errors.reduce((acc, error) => {
            // Simple parsing of error messages to determine field names
            const field = error.toLowerCase().includes('lecture')
              ? 'lectureId'
              : error.toLowerCase().includes('prerequisite')
                ? 'prerequisiteLectureId'
                : error.toLowerCase().includes('importance')
                  ? 'importanceLevel'
                  : 'general';
            acc[field] = error;
            return acc;
          }, {} as Record<string, string>)
        );
      }

      // Use the sanitized data
      const { lectureId, prerequisiteLectureId, isRequired = true, importanceLevel = 3 } = validation.sanitizedData!;

      // Check if both lectures exist using the lectureExists helper
      const [lectureExists, prerequisiteLectureExists] = await Promise.all([
        LectureController.lectureExists(lectureId),
        LectureController.lectureExists(prerequisiteLectureId)
      ]);

      if (!lectureExists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      if (!prerequisiteLectureExists) {
        throw new NotFoundError(`Prerequisite lecture with ID ${prerequisiteLectureId} not found`);
      }

      // Check if this prerequisite already exists
      const existingPrerequisite = await prisma.lecturePrerequisite.findFirst({
        where: {
          lectureId,
          prerequisiteLectureId
        }
      });

      if (existingPrerequisite) {
        // Create a custom ConflictError with the existingId property
        const error = new ConflictError('This prerequisite relationship already exists');
        (error as any).existingId = existingPrerequisite.id;
        throw error;
      }

      // Enhance circular dependency checking with additional validation
      const circularDependency = await this.checkCircularDependencies(lectureId, prerequisiteLectureId);
      if (circularDependency.hasCycle) {
        // Provide more detailed error information about the cycle
        const error = new CircularDependencyError(
          'Adding this prerequisite would create a circular dependency',
          circularDependency.path
        );
        throw error;
      }

      // Create the prerequisite with validated data
      const prerequisite = await prisma.lecturePrerequisite.create({
        data: {
          lectureId,
          prerequisiteLectureId,
          isRequired,
          importanceLevel
        },
        include: {
          lecture: true,
          prerequisiteLecture: true
        }
      });

      // Transform the prerequisite with lectures
      const transformedPrerequisite = {
        ...prerequisite,
        lecture: transformLecture(prerequisite.lecture),
        prerequisiteLecture: transformLecture(prerequisite.prerequisiteLecture)
      };

      return {
        success: true,
        data: transformedPrerequisite
      };
    } catch (error) {
      console.error('Error adding prerequisite:', error);

      // Preserve specific error types and additional information
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        // Handle special properties for different error types
        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        // For conflict errors with existingId
        if (error instanceof ConflictError && (error as any).existingId) {
          response.existingId = (error as any).existingId;
        }

        // For circular dependency errors
        if (error instanceof CircularDependencyError && error.path) {
          response.cycleDetails = {
            path: error.path,
            description: `Adding this prerequisite would create a dependency cycle: ${error.path.join(' -> ')}`
          };
        }

        return response;
      }

      // Generic database error
      return {
        success: false,
        error: `Failed to add prerequisite: ${error.message}`
      };
    }
  }

  /**
   * Update a prerequisite
   */
  static async updatePrerequisite(id: string, data: {
    isRequired?: boolean;
    importanceLevel?: number;
  }) {
    try {
      // Validate the update data
      const validation = this.validatePrerequisiteData(data, true);
      if (!validation.valid) {
        throw new ValidationError(
          `Validation failed: ${validation.errors.join(', ')}`,
          // Create a map of invalid fields
          validation.errors.reduce((acc, error) => {
            const field = error.toLowerCase().includes('importance')
              ? 'importanceLevel'
              : error.toLowerCase().includes('required')
                ? 'isRequired'
                : 'general';
            acc[field] = error;
            return acc;
          }, {} as Record<string, string>)
        );
      }

      // Use the sanitized data
      const sanitizedData = validation.sanitizedData!;

      // Check if prerequisite exists
      const prerequisite = await prisma.lecturePrerequisite.findUnique({
        where: { id }
      });

      if (!prerequisite) {
        throw new NotFoundError(`Prerequisite with ID ${id} not found`);
      }

      // Update the prerequisite with validated data
      const updatedPrerequisite = await prisma.lecturePrerequisite.update({
        where: { id },
        data: sanitizedData,
        include: {
          lecture: true,
          prerequisiteLecture: true
        }
      });

      // Transform the updated prerequisite
      const transformedPrerequisite = {
        ...updatedPrerequisite,
        lecture: transformLecture(updatedPrerequisite.lecture),
        prerequisiteLecture: transformLecture(updatedPrerequisite.prerequisiteLecture)
      };

      return {
        success: true,
        data: transformedPrerequisite
      };
    } catch (error) {
      console.error('Error updating prerequisite:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        // Add validation fields if this is a validation error
        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        return response;
      }

      // Generic error
      return {
        success: false,
        error: `Failed to update prerequisite: ${error.message}`
      };
    }
  }

  /**
   * Remove a prerequisite
   */
  static async removePrerequisite(id: string) {
    try {
      // Check if prerequisite exists
      const prerequisite = await prisma.lecturePrerequisite.findUnique({
        where: { id }
      });

      if (!prerequisite) {
        throw new NotFoundError(`Prerequisite with ID ${id} not found`);
      }

      // Delete the prerequisite
      await prisma.lecturePrerequisite.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Prerequisite removed successfully'
      };
    } catch (error) {
      console.error('Error removing prerequisite:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };
      }

      // Generic database error
      return {
        success: false,
        error: `Failed to remove prerequisite: ${error.message}`
      };
    }
  }

  /**
   * Check if a student has completed the prerequisites for a lecture
   */
  static async checkPrerequisitesSatisfied(userId: string, lectureId: string) {
    try {
      // Validate inputs
      if (!userId) {
        throw new ValidationError('User ID is required', {
          userId: 'User ID is required'
        });
      }

      // Use LectureController.lectureExists helper
      const exists = await LectureController.lectureExists(lectureId);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Use the centralized prerequisite checking utility
      return await this.checkAndCategorizePrerequisites(lectureId, userId);
    } catch (error) {
      console.error('Error checking prerequisites:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        // Add validation fields if this is a validation error
        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        return response;
      }

      // Generic error
      return {
        success: false,
        error: `Failed to check prerequisites: ${error.message}`
      };
    }
  }

  /**
   * Get available lectures for a student based on completed prerequisites
   */
  static async getAvailableLecturesForStudent(userId: string, options: {
    category?: string;
    includeDetails?: boolean;
    includeInProgress?: boolean;
  } = {}) {
    try {
      const { category, includeDetails = false, includeInProgress = true } = options;

      if (!userId) {
        throw new ValidationError('User ID is required', {
          userId: 'User ID is required'
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true } // Only select ID to optimize query
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Get all lectures
      const where: any = {};
      if (category) {
        where.category = category;
      }

      let allLectures;
      try {
        allLectures = await prisma.lecture.findMany({
          where,
          orderBy: [
            { category: 'asc' },
            { order: 'asc' }
          ]
        });
      } catch (dbError) {
        throw new DatabaseError(`Failed to fetch lectures: ${dbError.message}`);
      }

      // Get all user progress
      let userProgress;
      try {
        userProgress = await prisma.progress.findMany({
          where: { userId }
        });
      } catch (dbError) {
        throw new DatabaseError(`Failed to fetch user progress: ${dbError.message}`);
      }

      // Identify completed lectures
      const completedLectureIds = userProgress
        .filter(p => p.status === PROGRESS_STATUS.MASTERED)
        .map(p => p.lectureId);

      // Identify in-progress lectures
      const inProgressLectureIds = userProgress
        .filter(p => p.status !== PROGRESS_STATUS.LOCKED && p.status !== PROGRESS_STATUS.MASTERED)
        .map(p => p.lectureId);

      // Get all lecture prerequisites
      let allPrerequisites;
      try {
        allPrerequisites = await prisma.lecturePrerequisite.findMany({
          where: {
            lectureId: { in: allLectures.map(l => l.id) }
          }
        });
      } catch (dbError) {
        throw new DatabaseError(`Failed to fetch prerequisites: ${dbError.message}`);
      }

      // Group prerequisites by lecture
      const prerequisitesByLecture = allPrerequisites.reduce((acc, prereq) => {
        if (!acc[prereq.lectureId]) {
          acc[prereq.lectureId] = [];
        }
        acc[prereq.lectureId].push(prereq);
        return acc;
      }, {} as Record<string, typeof allPrerequisites>);

      // Determine which lectures are available
      const results = allLectures.map(lecture => {
        // Get prerequisites for this lecture
        const prerequisites = prerequisitesByLecture[lecture.id] || [];

        // Check if already completed
        const isCompleted = completedLectureIds.includes(lecture.id);

        // Check if in progress
        const isInProgress = inProgressLectureIds.includes(lecture.id);

        // Get required prerequisites
        const requiredPrerequisites = prerequisites.filter(p => p.isRequired);

        // Check if all required prerequisites are satisfied
        const allRequiredSatisfied = requiredPrerequisites.every(p =>
          completedLectureIds.includes(p.prerequisiteLectureId)
        );

        // Calculate readiness score
        const requiredCount = requiredPrerequisites.length;
        const completedRequiredCount = requiredPrerequisites.filter(p =>
          completedLectureIds.includes(p.prerequisiteLectureId)
        ).length;

        // Calculate score for required prerequisites
        let readinessScore = 0;
        if (requiredCount > 0) {
          readinessScore += 70 * (completedRequiredCount / requiredCount);
        } else {
          readinessScore += 70;
        }

        // Get recommended prerequisites
        const recommendedPrerequisites = prerequisites.filter(p => !p.isRequired);
        const recommendedCount = recommendedPrerequisites.length;
        const completedRecommendedCount = recommendedPrerequisites.filter(p =>
          completedLectureIds.includes(p.prerequisiteLectureId)
        ).length;

        // Calculate score for recommended prerequisites
        if (recommendedCount > 0) {
          readinessScore += 30 * (completedRecommendedCount / recommendedCount);
        } else {
          readinessScore += 30;
        }

        // Round to 2 decimal places
        readinessScore = Math.round(readinessScore * 100) / 100;

        // Determine status
        let status = 'LOCKED';
        if (isCompleted) {
          status = 'COMPLETED';
        } else if (isInProgress) {
          status = 'IN_PROGRESS';
        } else if (allRequiredSatisfied) {
          status = 'AVAILABLE';
        }

        // Create availability object
        return {
          lecture: transformLecture(lecture),
          isCompleted,
          isInProgress,
          isAvailable: allRequiredSatisfied && !isCompleted,
          status,
          readinessScore,
          prerequisitesSatisfied: allRequiredSatisfied,
          prerequisitesCount: {
            required: requiredCount,
            recommended: recommendedCount,
            completedRequired: completedRequiredCount,
            completedRecommended: completedRecommendedCount
          }
        };
      });

      // Filter as requested
      let filteredResults = results;
      if (!includeInProgress) {
        filteredResults = results.filter(r => !r.isInProgress);
      }

      // Transform the results
      return {
        success: true,
        data: transformArray(filteredResults, transformLectureAvailability)
      };
    } catch (error) {
      console.error('Error checking prerequisites:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        // Add validation fields if this is a validation error
        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        return response;
      }

      // Generic error
      return {
        success: false,
        error: `Failed to retrieve available lectures: ${error.message}`
      };
    }
  }

  /**
   * Suggest next lectures for a student based on completed prerequisites
   */
  static async suggestNextLectures(userId: string, options: {
    limit?: number;
    category?: string;
  } = {}) {
    try {
      const { limit = 5, category } = options;

      if (!userId) {
        throw new ValidationError('User ID is required', {
          userId: 'User ID is required'
        });
      }

      // Get available lectures for the student
      const availableLecturesResult = await this.getAvailableLecturesForStudent(userId, {
        category,
        includeInProgress: true
      });

      // Properly propagate errors from getAvailableLecturesForStudent
      if (!availableLecturesResult.success) {
        // If the result already contains statusCode, it's from a specific error type
        if ('statusCode' in availableLecturesResult) {
          return availableLecturesResult;
        }

        // Otherwise, convert to generic error
        throw new Error(availableLecturesResult.error || 'Failed to retrieve available lectures');
      }

      const availableLectures = availableLecturesResult.data;

      // Filter to just available and in-progress lectures
      const candidateLectures = availableLectures.filter(
        l => l.status === 'AVAILABLE' || l.status === 'IN_PROGRESS'
      );

      // Sort by:
      // 1. In-progress first
      // 2. Then by readiness score (higher is better)
      // 3. Then by importance level of prerequisites
      const sortedLectures = [...candidateLectures].sort((a, b) => {
        // In-progress first
        if (a.isInProgress && !b.isInProgress) return -1;
        if (!a.isInProgress && b.isInProgress) return 1;

        // Then by readiness score
        if (a.readinessScore !== b.readinessScore) {
          return b.readinessScore - a.readinessScore;
        }

        // Then by order within category
        const lectureA = a.lecture;
        const lectureB = b.lecture;

        if (lectureA.category !== lectureB.category) {
          return lectureA.category.localeCompare(lectureB.category);
        }

        return lectureA.order - lectureB.order;
      });

      // Take the requested number of suggestions
      const suggestions = sortedLectures.slice(0, limit);

      // Transform the suggestions
      return {
        success: true,
        data: transformArray(suggestions, transformLectureAvailability)
      };
    } catch (error) {
      console.error('Error suggesting next lectures:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        return response;
      }

      // Generic error
      return {
        success: false,
        error: `Failed to suggest next lectures: ${error.message}`
      };
    }
  }

  /**
   * Enhanced check for circular dependencies before creating a prerequisite
   * with additional validation and more detailed path information.
   *
   * This method can either throw a CircularDependencyError or return a result object.
   * @param throwError If true, throws CircularDependencyError when a cycle is found
   */
  static async checkCircularDependencies(
    lectureId: string,
    prerequisiteId: string,
    throwError: boolean = false
  ): Promise<{
    hasCycle: boolean;
    path: string[];
    lectureNames?: Record<string, string>; // Map of lecture IDs to names for easier debugging
  }> {
    // Initialize data structures for cycle detection
    const visited = new Set<string>();
    const path: string[] = [];
    const lectureNames: Record<string, string> = {};

    // Function to get lecture name and cache it
    const getLectureName = async (id: string): Promise<string> => {
      if (!lectureNames[id]) {
        const lecture = await prisma.lecture.findUnique({
          where: { id },
          select: { title: true }
        });
        lectureNames[id] = lecture?.title || `Unknown Lecture (${id})`;
      }
      return lectureNames[id];
    };

    // Function to perform depth-first search
    const dfs = async (currentId: string, target: string): Promise<boolean> => {
      // If we reach the target, we found a cycle
      if (currentId === target) {
        path.push(currentId);
        return true;
      }

      // Mark the current node as visited
      visited.add(currentId);
      path.push(currentId);

      // Get lecture name for improved debug info
      await getLectureName(currentId);

      // Get all prerequisites of the current lecture
      let prerequisites;
      try {
        prerequisites = await prisma.lecturePrerequisite.findMany({
          where: { lectureId: currentId },
          select: { prerequisiteLectureId: true }
        });
      } catch (error) {
        throw new DatabaseError(`Failed to check dependencies: ${error.message}`);
      }

      // Check each prerequisite recursively
      for (const prereq of prerequisites) {
        const prereqId = prereq.prerequisiteLectureId;

        // Get lecture name
        await getLectureName(prereqId);

        // If we haven't visited this node yet
        if (!visited.has(prereqId)) {
          if (await dfs(prereqId, target)) {
            return true; // Cycle found
          }
        }
        // If we have visited this node and it's in our current path, we found a cycle
        // (This helps detect other types of cycles beyond just the target)
        else if (path.includes(prereqId)) {
          // We've found a different cycle - add this info to the result
          console.warn(`Found additional cycle involving ${prereqId}`);
          return true;
        }
      }

      // Remove the current lecture from the path
      path.pop();

      return false; // No cycle found
    };

    try {
      // Start DFS from the prerequisite
      const hasCycle = await dfs(prerequisiteId, lectureId);

      // If a cycle was found, add the target lecture to close the loop
      if (hasCycle) {
        path.push(lectureId);
        await getLectureName(lectureId);
      }

      // Convert path IDs to lecture names for better debugging
      const pathWithNames = hasCycle
        ? path.map(id => `${lectureNames[id] || 'Unknown'} (${id})`)
        : [];

      // If throwError is true and a cycle was found, throw CircularDependencyError
      if (throwError && hasCycle) {
        throw new CircularDependencyError(
          'Adding this prerequisite would create a circular dependency',
          pathWithNames
        );
      }

      // Return the result
      return {
        hasCycle,
        path: pathWithNames,
        lectureNames: hasCycle ? lectureNames : undefined
      };
    } catch (error) {
      // If the error is already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Otherwise, convert to a DatabaseError
      console.error('Error in dependency checking:', error);
      throw new DatabaseError(`Failed to check for circular dependencies: ${error.message}`);
    }
  }
  /**
   * Check prerequisites for a lecture and return detailed information
   * This centralizes prerequisite checking logic in one place
   */
  static async checkAndCategorizePrerequisites(lectureId: string, userId: string) {
    try {
      // Input validation
      if (!lectureId || !userId) {
        const invalidFields: Record<string, string> = {};

        if (!lectureId) {
          invalidFields.lectureId = 'Lecture ID is required';
        }

        if (!userId) {
          invalidFields.userId = 'User ID is required';
        }

        throw new ValidationError(
          'Both lecture ID and user ID are required',
          invalidFields
        );
      }

      // Verify entities exist
      try {
        // Check if lecture exists
        const lectureExists = await LectureController.lectureExists(lectureId);
        if (!lectureExists) {
          throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true } // Only select ID to optimize the query
        });

        if (!user) {
          throw new NotFoundError(`User with ID ${userId} not found`);
        }
      } catch (error) {
        // Pass through AppError, but wrap other errors
        if (error instanceof AppError) {
          throw error;
        }
        throw new DatabaseError(`Error verifying entities: ${error.message}`);
      }

      // Get all prerequisites for the lecture
      let prerequisites;
      try {
        prerequisites = await prisma.lecturePrerequisite.findMany({
          where: { lectureId },
          include: {
            prerequisiteLecture: true
          }
        });
      } catch (error) {
        throw new DatabaseError(`Failed to fetch prerequisites: ${error.message}`);
      }

      // If no prerequisites, the conditions are satisfied
      if (prerequisites.length === 0) {
        return {
          success: true,
          data: {
            satisfied: true,
            requiredPrerequisites: [],
            completedPrerequisites: [],
            missingRequiredPrerequisites: [],
            recommendedPrerequisites: [],
            completedRecommendedPrerequisites: [],
            readinessScore: 100 // Full score if no prerequisites
          }
        };
      }

      // Get the user's progress for all prerequisites
      const prerequisiteIds = prerequisites.map(p => p.prerequisiteLectureId);
      let userProgress;
      try {
        userProgress = await prisma.progress.findMany({
          where: {
            userId,
            lectureId: { in: prerequisiteIds }
          }
        });
      } catch (error) {
        throw new DatabaseError(`Failed to fetch user progress: ${error.message}`);
      }

      // Organize prerequisites by required/recommended
      const requiredPrerequisites = prerequisites.filter(p => p.isRequired);
      const recommendedPrerequisites = prerequisites.filter(p => !p.isRequired);

      // Identify completed prerequisites
      const completedPrerequisiteIds = userProgress
        .filter(p => p.status === PROGRESS_STATUS.MASTERED)
        .map(p => p.lectureId);

      // Check which required prerequisites are completed
      const completedRequiredPrerequisites = requiredPrerequisites
        .filter(p => completedPrerequisiteIds.includes(p.prerequisiteLectureId));

      // Check which required prerequisites are missing
      const missingRequiredPrerequisites = requiredPrerequisites
        .filter(p => !completedPrerequisiteIds.includes(p.prerequisiteLectureId));

      // Check which recommended prerequisites are completed
      const completedRecommendedPrerequisites = recommendedPrerequisites
        .filter(p => completedPrerequisiteIds.includes(p.prerequisiteLectureId));

      // Calculate readiness score
      let readinessScore = 0;

      // If required prerequisites exist, they contribute 70% of the score
      if (requiredPrerequisites.length > 0) {
        readinessScore += 70 * (completedRequiredPrerequisites.length / requiredPrerequisites.length);
      } else {
        // If no required prerequisites, this part is automatically 70%
        readinessScore += 70;
      }

      // Recommended prerequisites contribute 30% of the score
      if (recommendedPrerequisites.length > 0) {
        readinessScore += 30 * (completedRecommendedPrerequisites.length / recommendedPrerequisites.length);
      } else {
        // If no recommended prerequisites, this part is automatically 30%
        readinessScore += 30;
      }

      // Round to 2 decimal places
      readinessScore = Math.round(readinessScore * 100) / 100;

      // Determine if all required prerequisites are satisfied
      const satisfied = missingRequiredPrerequisites.length === 0;

      // Prepare prerequisites result
      const prerequisitesResult = {
        satisfied,
        requiredPrerequisites: transformArray(requiredPrerequisites, transformLecturePrerequisite),
        completedPrerequisites: transformArray(completedRequiredPrerequisites, transformLecturePrerequisite),
        missingRequiredPrerequisites: transformArray(missingRequiredPrerequisites, transformLecturePrerequisite),
        recommendedPrerequisites: transformArray(recommendedPrerequisites, transformLecturePrerequisite),
        completedRecommendedPrerequisites: transformArray(completedRecommendedPrerequisites, transformLecturePrerequisite),
        readinessScore
      };

      return {
        success: true,
        data: transformPrerequisiteCheckResult(prerequisitesResult)
      };
    } catch (error) {
      console.error('Error checking prerequisites:', error);

      // Preserve specific error types
      if (error instanceof AppError) {
        const response: any = {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };

        // Add validation fields if this is a validation error
        if (error instanceof ValidationError && error.invalidFields) {
          response.invalidFields = error.invalidFields;
        }

        return response;
      }

      // Generic error
      return {
        success: false,
        error: `Failed to check prerequisites: ${error.message}`
      };
    }
  }
}
