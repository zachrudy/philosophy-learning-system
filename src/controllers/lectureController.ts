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
  createApiResponse,
  createPaginatedResponse,
  transformArray,
  createTransformedResponse,
  createTransformedPaginatedResponse
} from '@/lib/transforms';

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
  }) {
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

      // Transform the results and create a paginated response
      const paginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      return {
        success: true,
        data: transformArray(lectures, transformLectureWithRelations),
        pagination: paginationMeta
      };
    } catch (error) {
      console.error('Error fetching lectures:', error);
      return {
        success: false,
        error: `Failed to fetch lectures: ${error.message}`
      };
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
  } = {}) {
    try {
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

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      // Transform the lecture data
      const transformedLecture = transformLectureWithRelations(lecture);

      return {
        success: true,
        data: transformedLecture
      };
    } catch (error) {
      console.error('Error fetching lecture:', error);
      return {
        success: false,
        error: `Failed to fetch lecture: ${error.message}`
      };
    }
  }

  /**
   * Create a new lecture
   */
  static async createLecture(data: CreateLectureDTO) {
    try {
      // Validate and sanitize the data
      const validation = this.validateLectureData(data);

      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
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
        // Create the lecture first with default prompts if needed
        const lecture = await tx.lecture.create({
          data: {
            ...lectureData,
            ...promptDefaults, // Apply prompt defaults for missing fields
            embedAllowed: data.embedAllowed !== undefined ? data.embedAllowed : true,
            order: data.order || 0, // Default order to 0 if not specified
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
              throw new Error(`Entity with ID ${entityId} not found`);
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

        // If entity relations are provided, create them
        if (entityRelations && entityRelations.length > 0) {
          for (const relation of entityRelations) {
            // Verify the entity exists
            const entity = await tx.philosophicalEntity.findUnique({
              where: { id: relation.entityId }
            });

            if (!entity) {
              throw new Error(`Entity with ID ${relation.entityId} not found`);
            }

            // Create the typed relation
            await tx.lectureEntityRelation.create({
              data: {
                lectureId: lecture.id,
                entityId: relation.entityId,
                relationType: relation.relationType
              }
            });
          }
        }

        // If prerequisites are provided, create them
        if (prerequisiteIds && prerequisiteIds.length > 0) {
          for (const prereq of prerequisiteIds) {
            // Verify the prerequisite lecture exists
            const prerequisiteLecture = await tx.lecture.findUnique({
              where: { id: prereq.id }
            });

            if (!prerequisiteLecture) {
              throw new Error(`Prerequisite lecture with ID ${prereq.id} not found`);
            }

            // Check for circular dependency
            if (prereq.id === lecture.id) {
              throw new Error('A lecture cannot be a prerequisite of itself');
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

        // Return the created lecture with its relationships
        return await tx.lecture.findUnique({
          where: { id: lecture.id },
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
      });

      // Transform the result
      const transformedResult = transformLectureWithRelations(result);

      return {
        success: true,
        data: transformedResult
      };
    } catch (error) {
      console.error('Error creating lecture:', error);
      return {
        success: false,
        error: `Failed to create lecture: ${error.message}`
      };
    }
  }

  /**
   * Update an existing lecture
   */
  static async updateLecture(id: string, data: UpdateLectureDTO) {
    try {
      // First check if lecture exists
      const existingLecture = await prisma.lecture.findUnique({
        where: { id }
      });

      if (!existingLecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      // Validate and sanitize the data
      const validation = this.validateLectureData(data, true);

      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
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

        // Handle entity relationships if provided
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

        // Handle entity relations if provided
        if (entityRelations !== undefined) {
          // First delete all current relations
          await tx.lectureEntityRelation.deleteMany({
            where: { lectureId: id }
          });

          // Then create the new relations
          if (entityRelations.length > 0) {
            for (const relation of entityRelations) {
              await tx.lectureEntityRelation.create({
                data: {
                  lectureId: id,
                  entityId: relation.entityId,
                  relationType: relation.relationType
                }
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
              // Check for circular dependency
              if (prereq.id === id) {
                throw new Error('A lecture cannot be a prerequisite of itself');
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

        // Return the updated lecture with its relationships
        return await tx.lecture.findUnique({
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
      });

      // Transform the result
      const transformedResult = transformLectureWithRelations(result);

      return {
        success: true,
        data: transformedResult
      };
    } catch (error) {
      console.error('Error updating lecture:', error);
      return {
        success: false,
        error: `Failed to update lecture: ${error.message}`
      };
    }
  }

  /**
   * Delete a lecture
   */
  static async deleteLecture(id: string) {
    try {
      // Check if lecture exists
      const lecture = await prisma.lecture.findUnique({
        where: { id },
        include: {
          prerequisites: true,
          prerequisiteFor: true
        }
      });

      if (!lecture) {
        return {
          success: false,
          error: 'Lecture not found'
        };
      }

      // Check if this lecture is a prerequisite for other lectures
      if (lecture.prerequisiteFor.length > 0) {
        return {
          success: false,
          error: 'Cannot delete lecture that is a prerequisite for other lectures',
          dependencies: lecture.prerequisiteFor.map(p => p.lectureId)
        };
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

      return {
        success: true,
        message: 'Lecture deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting lecture:', error);
      return {
        success: false,
        error: `Failed to delete lecture: ${error.message}`
      };
    }
  }

  /**
   * Get all entity relationships for a lecture
   */
  static async getLectureEntityRelations(lectureId: string) {
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

      return {
        success: true,
        data: transformedRelations
      };
    } catch (error) {
      console.error('Error fetching lecture entity relations:', error);
      return {
        success: false,
        error: `Failed to fetch lecture entity relations: ${error.message}`
      };
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
  static async rebalanceOrderInCategory(category: string, startOrder: number) {
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
}
