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

      // Check if lecture exists
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId }
      });

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
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

      return {
        success: true,
        data: prerequisites
      };
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
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

      // Check if lecture exists
      const lecture = await prisma.lecture.findUnique({
        where: { id: prerequisiteId }
      });

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      // Get lectures that have this prerequisite
      const dependentLectures = await prisma.lecturePrerequisite.findMany({
        where: { prerequisiteLectureId: prerequisiteId },
        include: {
          lecture: includeDetails
        }
      });

      return {
        success: true,
        data: dependentLectures
      };
    } catch (error) {
      console.error('Error fetching dependent lectures:', error);
      return {
        success: false,
        error: `Failed to fetch dependent lectures: ${error.message}`
      };
    }
  }

  /**
   * Add a prerequisite to a lecture
   */
  static async addPrerequisite(data: LecturePrerequisiteDTO) {
    try {
      const { lectureId, prerequisiteLectureId, isRequired = true, importanceLevel = 3 } = data;

      // Validate IDs
      if (!lectureId || !prerequisiteLectureId) {
        return {
          success: false,
          error: 'Lecture ID and prerequisite lecture ID are required'
        };
      }

      // Check if both lectures exist
      const [lecture, prerequisiteLecture] = await Promise.all([
        prisma.lecture.findUnique({ where: { id: lectureId } }),
        prisma.lecture.findUnique({ where: { id: prerequisiteLectureId } })
      ]);

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      if (!prerequisiteLecture) {
        return {
          success: false,
          error: 'Prerequisite lecture not found'
        };
      }

      // Check if this would create a self-reference
      if (lectureId === prerequisiteLectureId) {
        return {
          success: false,
          error: 'A lecture cannot be a prerequisite of itself'
        };
      }

      // Check if this prerequisite already exists
      const existingPrerequisite = await prisma.lecturePrerequisite.findFirst({
        where: {
          lectureId,
          prerequisiteLectureId
        }
      });

      if (existingPrerequisite) {
        return {
          success: false,
          error: 'This prerequisite relationship already exists',
          existingId: existingPrerequisite.id
        };
      }

      // Check for circular dependencies
      const circularDependency = await this.checkCircularDependencies(lectureId, prerequisiteLectureId);
      if (circularDependency.hasCycle) {
        return {
          success: false,
          error: 'Adding this prerequisite would create a circular dependency',
          path: circularDependency.path
        };
      }

      // Create the prerequisite
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

      return {
        success: true,
        data: prerequisite
      };
    } catch (error) {
      console.error('Error adding prerequisite:', error);
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
      // Check if prerequisite exists
      const prerequisite = await prisma.lecturePrerequisite.findUnique({
        where: { id }
      });

      if (!prerequisite) {
        return {
          success: false,
          error: 'Prerequisite not found'
        };
      }

      // Validate importance level
      if (data.importanceLevel !== undefined && (data.importanceLevel < 1 || data.importanceLevel > 5)) {
        return {
          success: false,
          error: 'Importance level must be between 1 and 5'
        };
      }

      // Update the prerequisite
      const updatedPrerequisite = await prisma.lecturePrerequisite.update({
        where: { id },
        data,
        include: {
          lecture: true,
          prerequisiteLecture: true
        }
      });

      return {
        success: true,
        data: updatedPrerequisite
      };
    } catch (error) {
      console.error('Error updating prerequisite:', error);
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
        return {
          success: false,
          error: 'Prerequisite not found'
        };
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
      // Check if lecture exists
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId }
      });

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      // Get all prerequisites for the lecture
      const prerequisites = await prisma.lecturePrerequisite.findMany({
        where: { lectureId },
        include: {
          prerequisiteLecture: true
        }
      });

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
      const userProgress = await prisma.progress.findMany({
        where: {
          userId,
          lectureId: { in: prerequisiteIds }
        }
      });

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

      return {
        success: true,
        data: {
          satisfied,
          requiredPrerequisites,
          completedPrerequisites: completedRequiredPrerequisites,
          missingRequiredPrerequisites,
          recommendedPrerequisites,
          completedRecommendedPrerequisites,
          readinessScore
        }
      };
    } catch (error) {
      console.error('Error checking prerequisites:', error);
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

      // Get all lectures
      const where: any = {};
      if (category) {
        where.category = category;
      }

      const allLectures = await prisma.lecture.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ]
      });

      // Get all user progress
      const userProgress = await prisma.progress.findMany({
        where: { userId }
      });

      // Identify completed lectures
      const completedLectureIds = userProgress
        .filter(p => p.status === PROGRESS_STATUS.MASTERED)
        .map(p => p.lectureId);

      // Identify in-progress lectures
      const inProgressLectureIds = userProgress
        .filter(p => p.status !== PROGRESS_STATUS.LOCKED && p.status !== PROGRESS_STATUS.MASTERED)
        .map(p => p.lectureId);

      // Get all lecture prerequisites
      const allPrerequisites = await prisma.lecturePrerequisite.findMany({
        where: {
          lectureId: { in: allLectures.map(l => l.id) }
        }
      });

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

        return {
          lecture,
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

      return {
        success: true,
        data: filteredResults
      };
    } catch (error) {
      console.error('Error getting available lectures:', error);
      return {
        success: false,
        error: `Failed to get available lectures: ${error.message}`
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

      // Get available lectures for the student
      const availableLecturesResult = await this.getAvailableLecturesForStudent(userId, {
        category,
        includeInProgress: true
      });

      if (!availableLecturesResult.success) {
        return availableLecturesResult;
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

      return {
        success: true,
        data: suggestions
      };
    } catch (error) {
      console.error('Error suggesting next lectures:', error);
      return {
        success: false,
        error: `Failed to suggest next lectures: ${error.message}`
      };
    }
  }

  /**
   * Check for circular dependencies before creating a prerequisite
   */
  static async checkCircularDependencies(lectureId: string, prerequisiteId: string): Promise<{
    hasCycle: boolean;
    path: string[];
  }> {
    // Initialize visited and path arrays for cycle detection
    const visited = new Set<string>();
    const path: string[] = [];

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

      // Get all prerequisites of the current lecture
      const prerequisites = await prisma.lecturePrerequisite.findMany({
        where: { lectureId: currentId },
        select: { prerequisiteLectureId: true }
      });

      // Check each prerequisite recursively
      for (const prereq of prerequisites) {
        const prereqId = prereq.prerequisiteLectureId;

        // If we haven't visited this node yet
        if (!visited.has(prereqId)) {
          if (await dfs(prereqId, target)) {
            return true; // Cycle found
          }
        }
      }

      // Remove the current lecture from the path
      path.pop();

      return false; // No cycle found
    };

    // Start DFS from the prerequisite
    const hasCycle = await dfs(prerequisiteId, lectureId);

    // If a cycle was found, add the target lecture to close the loop
    if (hasCycle) {
      path.push(lectureId);
    }

    // Get lecture names for all IDs in the path
    const pathWithNames = [];
    if (hasCycle) {
      for (const id of path) {
        const lecture = await prisma.lecture.findUnique({
          where: { id },
          select: { title: true }
        });
        pathWithNames.push({
          id,
          title: lecture?.title || 'Unknown Lecture'
        });
      }
    }

    return {
      hasCycle,
      path: hasCycle
        ? pathWithNames.map(p => `${p.title} (${p.id})`)
        : []
    };
  }
}
