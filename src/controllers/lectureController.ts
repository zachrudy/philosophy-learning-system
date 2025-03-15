// src/controllers/lectureController.ts

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  serializeJsonForDb,
  deserializeJsonFromDb,
  LECTURE_ENTITY_RELATION_TYPES
} from '@/lib/constants';
import {
  Lecture,
  LectureWithRelations,
  CreateLectureDTO,
  UpdateLectureDTO,
  LectureEntityRelationType,
  LectureEntityRelationDTO,
  LecturePrerequisiteDTO
} from '@/types/models';
import { validateLecture } from '@/lib/validation/lectureValidation';
// Import the transform functions
import {
  transformLecture,
  transformLectureWithRelations,
  transformLectureEntityRelation,  
  createApiResponse,
  createPaginatedResponse,
  transformArray,
  createTransformedResponse,
  createTransformedPaginatedResponse
} from '@/lib/transforms';
// Import error classes
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  CircularDependencyError,
  DatabaseError,
  DependencyError
} from '@/lib/errors/appErrors';

// Add this to the existing imports in src/controllers/lectureController.ts
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/responseUtils';

/**
 * Standard success response type
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metadata?: Record<string, any>;
};

/**
 * Standard error response type
 */
export type ErrorResponse = {
  success: false;
  error: string;
  statusCode: number;
  invalidFields?: Record<string, string>;
  cycleDetails?: {
    path: string[];
    description: string;
  };
  dependencies?: string[];
};

/**
 * Unified response type
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Controller for managing lectures
 */
export class LectureController {
  /**
   * Get all lectures with optional filtering and pagination
   */
  static async getAllLectures(options: {
    category?: string;
    lecturerName?: string;
    contentType?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeEntities?: boolean;
    includePrerequisites?: boolean;
    deep?: boolean;
  }): Promise<ApiResponse<Lecture[]>> {
    try {
      const {
        category,
        lecturerName,
        contentType,
        search,
        page = 1,
        limit = 10,
        includeEntities = false,
        includePrerequisites = false,
        deep = false
      } = options;

      // Build the where clause for filtering
      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (lecturerName) {
        where.lecturerName = lecturerName;
      }

      if (contentType) {
        where.contentType = contentType;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination info
      const total = await prisma.lecture.count({ where });

      // Set up include object for related data
      const include: any = {};

      if (includeEntities) {
        include.entities = true;
        include.entityRelations = deep ? {
          include: {
            entity: true
          }
        } : true;
      }

      if (includePrerequisites) {
        include.prerequisites = deep ? {
          include: {
            prerequisiteLecture: true
          }
        } : true;
        include.prerequisiteFor = deep ? {
          include: {
            lecture: true
          }
        } : true;
      }

      // Get paginated lectures
      const lectures = await prisma.lecture.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        skip,
        take: limit,
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ]
      });

      // Transform the results
      const transformedLectures = transformArray(lectures, transformLectureWithRelations);

      // Use the new paginatedResponse utility
      return paginatedResponse(transformedLectures, {
        page,
        limit,
        total,
        additionalMetadata: {
          filters: {
            category,
            lecturerName,
            contentType,
            search
          }
        }
      });
    } catch (error) {
      console.error('Error fetching lectures:', error);

      // Use the new errorResponse utility
      if (error instanceof AppError) {
        return errorResponse(error);
      }

      // Wrap unknown errors as DatabaseError
      const dbError = new DatabaseError('Failed to fetch lectures');
      return errorResponse(dbError);
    }
  }

  /**
   * Get lecture by ID
   */
  static async getLectureById(id: string, options: {
    includeEntities?: boolean;
    includePrerequisites?: boolean;
    includeProgress?: boolean;
    includeReflections?: boolean;
    deep?: boolean;
  } = {}): Promise<ApiResponse<Lecture>> {
    try {
      // Use the helper method to check if lecture exists
      const exists = await LectureController.lectureExists(id);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${id} not found`);
      }

      const {
        includeEntities = false,
        includePrerequisites = false,
        includeProgress = false,
        includeReflections = false,
        deep = false
      } = options;

      // Build include object for related data
      const include: any = {};

      if (includeEntities) {
        include.entities = true;
        include.entityRelations = deep ? {
          include: {
            entity: true
          }
        } : true;
      }

      if (includePrerequisites) {
        include.prerequisites = deep ? {
          include: {
            prerequisiteLecture: true
          }
        } : true;
        include.prerequisiteFor = deep ? {
          include: {
            lecture: true
          }
        } : true;
      }

      if (includeProgress) {
        include.progress = true;
      }

      if (includeReflections) {
        include.reflections = true;
      }

      // Get lecture with specified relations
      const lecture = await prisma.lecture.findUnique({
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined
      });

      // Transform the lecture data
      const transformedLecture = transformLectureWithRelations(lecture);

      // Use the successResponse utility
      return successResponse(transformedLecture, null, {
        includeOptions: options
      });
    } catch (error) {
      console.error('Error fetching lecture:', error);

      // Use errorResponse utility for consistent error handling
      if (error instanceof AppError) {
        return errorResponse(error);
      }

      // Wrap unknown errors
      const dbError = new DatabaseError(`Failed to fetch lecture: ${error.message}`);
      return errorResponse(dbError);
    }
  }

  /**
   * Create a new lecture
   */
  static async createLecture(data: CreateLectureDTO): Promise<ApiResponse<Lecture>> {
    try {
      // Validate and sanitize the data
      const validation = this.validateLectureData(data);

      if (!validation.valid) {
        throw new ValidationError(
          `Validation failed: ${validation.errors.join(', ')}`,
          validation.errors.reduce((acc, error) => {
            // Convert validation errors to a field:message format
            const match = error.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              acc[match[1].trim()] = match[2].trim();
            } else {
              // Use a generic key if the format doesn't match
              acc[`field_${Object.keys(acc).length}`] = error;
            }
            return acc;
          }, {})
        );
      }

      // Use the sanitized data
      const sanitizedData = validation.sanitizedData!;

      // The prompt fields can have default placeholders if not provided (for CSV import workflow)
      const promptDefaults = {
        preLecturePrompt: data.preLecturePrompt || "What do you already know about this topic? (To be updated)",
        initialPrompt: data.initialPrompt || "What are your initial thoughts after watching this lecture? (To be updated)",
        masteryPrompt: data.masteryPrompt || "Demonstrate your understanding of the key concepts. (To be updated)",
        evaluationPrompt: data.evaluationPrompt || "Evaluation criteria placeholder. (To be updated)",
        discussionPrompts: data.discussionPrompts || "Discussion prompts placeholder. (To be updated)",
      };

      // Extract entity relationships and prerequisites for separate handling
      const { entityIds, entityRelations, prerequisiteIds, ...lectureData } = data;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: PrismaClient) => {
        // If order is not specified, get the next available order for the category
        let order = data.order;
        if (order === undefined) {
          // Can't use this.getNextOrderInCategory inside the transaction because
          // it uses the global prisma instance, not the transaction instance
          const maxOrderLecture = await tx.lecture.findFirst({
            where: { category: lectureData.category },
            orderBy: { order: 'desc' }
          });
          order = maxOrderLecture ? maxOrderLecture.order + 1 : 0;
        }

        // Create the lecture first with default prompts if needed
        const lecture = await tx.lecture.create({
          data: {
            ...lectureData,
            ...promptDefaults, // Apply prompt defaults for missing fields
            embedAllowed: data.embedAllowed !== undefined ? data.embedAllowed : true,
            order: order,
          }
        });

        // If entity IDs are provided, connect them directly
        if (entityIds && entityIds.length > 0) {
          for (const entityId of entityIds) {
            // Verify the entity exists
            const entity = await tx.philosophicalEntity.findUnique({
              where: { id: entityId }
            });

            if (!entity) {
              throw new NotFoundError(`Entity with ID ${entityId} not found`);
            }

            // Connect the entity to the lecture
            await tx.philosophicalEntity.update({
              where: { id: entityId },
              data: {
                lectureId: lecture.id
              }
            });
          }
        }

        // If prerequisites are provided, create them
        if (prerequisiteIds && prerequisiteIds.length > 0) {
          for (const prereq of prerequisiteIds) {
            // Verify the prerequisite lecture exists using our helper
            const prerequisiteExists = await LectureController.lectureExists(prereq.id);
            if (!prerequisiteExists) {
              throw new NotFoundError(`Prerequisite lecture with ID ${prereq.id} not found`);
            }

            // Check for circular dependency
            if (prereq.id === lecture.id) {
              throw new ValidationError('A lecture cannot be a prerequisite of itself');
            }

            // Create the prerequisite relationship
            await tx.lecturePrerequisite.create({
              data: {
                lectureId: lecture.id,
                prerequisiteLectureId: prereq.id,
                isRequired: prereq.isRequired !== undefined ? prereq.isRequired : true,
                importanceLevel: prereq.importanceLevel || 3
              }
            });
          }
        }

        // Return the created lecture ID for further operations
        return lecture.id;
      });

      // After transaction completes, update entity relationships if provided
      if (entityRelations && entityRelations.length > 0) {
        await this.updateEntityRelationships(result, entityRelations);
      }

      // Fetch the fully populated lecture with all relationships
      const completeLecture = await prisma.lecture.findUnique({
        where: { id: result },
        include: {
          entities: true,
          entityRelations: {
            include: {
              entity: true
            }
          },
          prerequisites: {
            include: {
              prerequisiteLecture: true
            }
          }
        }
      });

      // Transform the result
      const transformedResult = transformLectureWithRelations(completeLecture);

      // Use successResponse with HTTP 201 Created implied
      return successResponse(transformedResult, 'Lecture created successfully', {
        created: true,
        id: result
      });
    } catch (error) {
      console.error('Error creating lecture:', error);

      // Use errorResponse for consistent error handling
      return errorResponse(error);
    }
  }

  /**
   * Update an existing lecture
   */
  static async updateLecture(id: string, data: UpdateLectureDTO): Promise<ApiResponse<Lecture>> {
    try {
      // Use the helper method to check if lecture exists
      const exists = await LectureController.lectureExists(id);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${id} not found`);
      }

      // Validate and sanitize the data
      const validation = this.validateLectureData(data, true);

      if (!validation.valid) {
        throw new ValidationError(
          `Validation failed: ${validation.errors.join(', ')}`,
          validation.errors.reduce((acc, error) => {
            const match = error.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              acc[match[1].trim()] = match[2].trim();
            } else {
              acc[`field_${Object.keys(acc).length}`] = error;
            }
            return acc;
          }, {})
        );
      }

      // Use the sanitized data
      const sanitizedData = validation.sanitizedData!;

      // Extract entity relationships and prerequisites for separate handling
      const { entityIds, entityRelations, prerequisiteIds, ...lectureData } = data;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: PrismaClient) => {
        // Update the lecture first
        const updatedLecture = await tx.lecture.update({
          where: { id },
          data: lectureData
        });

        // Handle entity IDs if provided
        if (entityIds !== undefined) {
          // First disconnect all current entities
          await tx.philosophicalEntity.updateMany({
            where: { lectureId: id },
            data: { lectureId: null }
          });

          // Then reconnect the new entities
          if (entityIds.length > 0) {
            for (const entityId of entityIds) {
              await tx.philosophicalEntity.update({
                where: { id: entityId },
                data: { lectureId: id }
              });
            }
          }
        }

        // Handle prerequisites if provided
        if (prerequisiteIds !== undefined) {
          // First delete all current prerequisites
          await tx.lecturePrerequisite.deleteMany({
            where: { lectureId: id }
          });

          // Then create the new prerequisites
          if (prerequisiteIds.length > 0) {
            for (const prereq of prerequisiteIds) {
              // Check for self-reference
              if (prereq.id === id) {
                throw new CircularDependencyError('A lecture cannot be a prerequisite of itself');
              }

              await tx.lecturePrerequisite.create({
                data: {
                  lectureId: id,
                  prerequisiteLectureId: prereq.id,
                  isRequired: prereq.isRequired !== undefined ? prereq.isRequired : true,
                  importanceLevel: prereq.importanceLevel || 3
                }
              });
            }
          }
        }

        return updatedLecture.id;
      });

      // After transaction completes, update entity relationships if provided
      if (entityRelations !== undefined) {
        await this.updateEntityRelationships(id, entityRelations);
      }

      // Fetch the fully populated updated lecture with all relationships
      const updatedLecture = await prisma.lecture.findUnique({
        where: { id },
        include: {
          entities: true,
          entityRelations: {
            include: {
              entity: true
            }
          },
          prerequisites: {
            include: {
              prerequisiteLecture: true
            }
          }
        }
      });

      // Transform the result
      const transformedResult = transformLectureWithRelations(updatedLecture);

      // Use successResponse with helpful metadata
      return successResponse(transformedResult, 'Lecture updated successfully', {
        updated: true,
        id: id,
        changedFields: Object.keys(data)
      });

    } catch (error) {
      console.error('Error updating lecture:', error);

      // Use errorResponse for consistent error handling
      return errorResponse(error);
    }
  }

  /**
   * Delete a lecture
   */
  static async deleteLecture(id: string) {
    try {
      // Use the helper method to check if lecture exists
      const exists = await LectureController.lectureExists(id);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${id} not found`);
      }

      // Get the lecture to check for prerequisites
      const lecture = await prisma.lecture.findUnique({
        where: { id },
        include: {
          prerequisites: true,
          prerequisiteFor: true
        }
      });

      // Check if this lecture is a prerequisite for other lectures
      if (lecture.prerequisiteFor.length > 0) {
        throw new DependencyError(
          'Cannot delete lecture that is a prerequisite for other lectures',
          lecture.prerequisiteFor.map(p => p.lectureId)
        );
      }

      // Use transaction for atomicity
      await prisma.$transaction(async (tx: PrismaClient) => {
        // Delete all entity relationships
        await tx.lectureEntityRelation.deleteMany({
          where: { lectureId: id }
        });

        // Delete all prerequisites
        await tx.lecturePrerequisite.deleteMany({
          where: { lectureId: id }
        });

        // Disconnect entities
        await tx.philosophicalEntity.updateMany({
          where: { lectureId: id },
          data: { lectureId: null }
        });

        // Delete the lecture
        await tx.lecture.delete({
          where: { id }
        });
      });

      // After deletion, rebalance the order in the category
      await this.rebalanceOrderInCategory(lecture.category, lecture.order);

      // Use successResponse with meaningful message and metadata
      return successResponse(null, 'Lecture deleted successfully', {
        deletedId: id,
        category: lecture.category,
        rebalanced: true
      });

    } catch (error) {
      console.error('Error deleting lecture:', error);

      // Use errorResponse for consistent error handling
      return errorResponse(error);
    }
  }

  /**
   * Get all entity relationships for a lecture
   */
  static async getLectureEntityRelations(lectureId: string): Promise<ApiResponse<any[]>> {
    try {
      // Use the helper method to check if lecture exists
      const exists = await LectureController.lectureExists(lectureId);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      // Get entity relationships
      const entityRelations = await prisma.lectureEntityRelation.findMany({
        where: { lectureId },
        include: {
          entity: true
        }
      });

      // Transform the entity relations
      const transformedRelations = transformArray(entityRelations,
                                    (relation) => transformLectureEntityRelation(relation));

      // Use successResponse with count metadata
      return successResponse(transformedRelations, null, {
        count: transformedRelations.length,
        lectureId
      });

    } catch (error) {
      console.error('Error fetching lecture entity relations:', error);

      // Use errorResponse for consistent error handling
      return errorResponse(error);
    }
  }

  /**
   * Checks if the provided order value is unique within the category
   */
  static async isOrderUniqueInCategory(category: string, order: number, excludeLectureId?: string): Promise<boolean> {
    const where: any = {
      category,
      order,
    };

    // Exclude the lecture being updated if an ID is provided
    if (excludeLectureId) {
      where.id = {
        not: excludeLectureId
      };
    }

    const existingLecture = await prisma.lecture.findFirst({
      where
    });

    return !existingLecture;
  }

  /**
   * Gets the next available order in a category
   */
  static async getNextOrderInCategory(category: string): Promise<number> {
    const maxOrderLecture = await prisma.lecture.findFirst({
      where: { category },
      orderBy: { order: 'desc' }
    });

    return maxOrderLecture ? maxOrderLecture.order + 1 : 0;
  }

  /**
   * Rebalances the order of lectures in a category after a lecture is inserted or removed
   */
  static async rebalanceOrderInCategory(category: string, startOrder: number): Promise<void> {
    try {
      // Get all lectures in the category from the start order
      const lectures = await prisma.lecture.findMany({
        where: {
          category,
          order: { gte: startOrder }
        },
        orderBy: { order: 'asc' }
      });

      // Rebalance the order
      for (let i = 0; i < lectures.length; i++) {
        const lecture = lectures[i];
        const newOrder = startOrder + i;

        if (lecture.order !== newOrder) {
          await prisma.lecture.update({
            where: { id: lecture.id },
            data: { order: newOrder }
          });
        }
      }
    } catch (error) {
      console.error('Error rebalancing lecture order:', error);
      throw new DatabaseError(`Failed to rebalance lecture order: ${error.message}`);
    }
  }

  /**
   * Enhanced validation method using the dedicated validation module
   */
  static validateLectureData(data: Partial<CreateLectureDTO>, isUpdate = false): {
    valid: boolean;
    errors: string[];
    sanitizedData?: Partial<CreateLectureDTO>;
  } {
    return validateLecture(data, isUpdate);
  }

  /**
   * Sanitize lecture data for safe storage
   * Private helper method
   */
  private static sanitizeLectureData(data: any): any {
    const sanitized = { ...data };

    // Basic XSS protection - replace script tags
    const sanitizeField = (field: string) => {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = sanitized[field].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    };

    // Sanitize text fields
    ['title', 'description', 'preLecturePrompt', 'initialPrompt',
     'masteryPrompt', 'evaluationPrompt', 'discussionPrompts'].forEach(sanitizeField);

    return sanitized;
  }

  /**
   * Check if a lecture exists by ID
   * This is a utility method that can be used by other controllers and components
   */
  static async lectureExists(id: string): Promise<boolean> {
    try {
      if (!id) return false;

      const lecture = await prisma.lecture.findUnique({
        where: { id },
        select: { id: true } // Only select the ID for efficiency
      });

      return lecture !== null;
    } catch (error) {
      console.error(`Error checking if lecture exists (ID: ${id}):`, error);
      return false;
    }
  }

  /**
   * Safely update entity relationships for a lecture
   * This centralizes the logic for updating lecture-entity relationships
   */
  static async updateEntityRelationships(lectureId: string, entityRelations: LectureEntityRelationDTO[]): Promise<ApiResponse<any[]>> {
    try {
      // First check if lecture exists
      const exists = await this.lectureExists(lectureId);
      if (!exists) {
        throw new NotFoundError(`Lecture with ID ${lectureId} not found`);
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: PrismaClient) => {
        // Delete all current relations
        await tx.lectureEntityRelation.deleteMany({
          where: { lectureId }
        });

        // Create new relations if provided
        if (entityRelations && entityRelations.length > 0) {
          const createdRelations = [];

          for (const relation of entityRelations) {
            // Verify the entity exists
            const entity = await tx.philosophicalEntity.findUnique({
              where: { id: relation.entityId }
            });

            if (!entity) {
              throw new NotFoundError(`Entity with ID ${relation.entityId} not found`);
            }

            // Validate relation type
            if (!Object.values(LECTURE_ENTITY_RELATION_TYPES).includes(relation.relationType)) {
              throw new ValidationError(`Invalid relation type: ${relation.relationType}`, {
                relationType: `"${relation.relationType}" is not a valid relation type`
              });
            }

            // Create the relation
            const created = await tx.lectureEntityRelation.create({
              data: {
                lectureId,
                entityId: relation.entityId,
                relationType: relation.relationType
              },
              include: {
                entity: true
              }
            });

            createdRelations.push(created);
          }

          return createdRelations;
        }

        return [];
      });

      // Transform the created relationships
      const transformedRelations = transformArray(result, transformLectureEntityRelation);

      // Use successResponse with helpful metadata
      return successResponse(transformedRelations, 'Entity relationships updated successfully', {
        count: transformedRelations.length,
        lectureId: lectureId
      });

    } catch (error) {
      console.error('Error updating entity relationships:', error);

      // Use errorResponse for consistent error handling
      return errorResponse(error);
    }
  }
}
