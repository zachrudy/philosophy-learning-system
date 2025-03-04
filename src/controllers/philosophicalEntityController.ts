// src/controllers/philosophicalEntityController.ts

import { prisma } from '@/lib/db/prisma';
import { RelationType } from '@prisma/client';
import { serializeJsonForDb, deserializeJsonFromDb } from '@/lib/constants';
import {
  CreatePhilosophicalEntityDTO,
  CreatePhilosophicalRelationDTO,
  PhilosophicalEntityWithRelations
} from '@/types/models';

/**
 * Controller for managing philosophical entities and their relationships
 */
export class PhilosophicalEntityController {
  /**
   * Get all philosophical entities with filtering and pagination
   */
  static async getAllEntities(options: {
    type?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    try {
      const { type, search, page, limit } = options;

      // Build the where clause for filtering
      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination info
      const total = await prisma.philosophicalEntity.count({ where });

      // Get paginated entities
      const entities = await prisma.philosophicalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc' // Default ordering by name
        }
      });

      return {
        success: true,
        data: entities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching entities:', error);
      return {
        success: false,
        error: `Failed to fetch entities: ${error.message}`
      };
    }
  }

  /**
   * Create a new philosophical entity
   */
  static async createEntity(data: CreatePhilosophicalEntityDTO) {
    try {
      // Validate entity type
      const validTypes = [
        'Philosopher',
        'PhilosophicalConcept',
        'Branch',
        'Movement',
        'Problematic',
        'Era'
      ];

      if (!data.type || !validTypes.includes(data.type)) {
        return {
          success: false,
          error: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`
        };
      }

      // Handle array fields that need to be serialized for storage
      const processedData = { ...data };

      // Serialize keyTerms array if provided
      if (Array.isArray(processedData.keyTerms)) {
        processedData.keyTerms = serializeJsonForDb(processedData.keyTerms);
      }

      // Sanitize input data to prevent XSS
      const sanitizedData = this.sanitizeEntityData(processedData);

      // Create the entity
      const entity = await prisma.philosophicalEntity.create({
        data: sanitizedData
      });

      // Return the created entity
      return {
        success: true,
        data: entity
      };
    } catch (error) {
      console.error('Error creating entity:', error);
      return {
        success: false,
        error: `Failed to create entity: ${error.message}`
      };
    }
  }

  /**
   * Get entity by ID with its relationships
   */
  static async getEntityById(id: string) {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Invalid entity ID'
        };
      }

      const entity = await prisma.philosophicalEntity.findUnique({
        where: { id },
        include: {
          sourceRelations: {
            include: {
              targetEntity: true
            }
          },
          targetRelations: {
            include: {
              sourceEntity: true
            }
          }
        }
      });

      if (!entity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      // Deserialize JSON fields
      const deserializedEntity = this.deserializeEntityData(entity);

      // Transform the data to include all relationships in a single array
      const relationships = [
        ...deserializedEntity.sourceRelations.map(r => ({
          ...r,
          direction: 'outgoing',
          relatedEntity: r.targetEntity
        })),
        ...deserializedEntity.targetRelations.map(r => ({
          ...r,
          direction: 'incoming',
          relatedEntity: r.sourceEntity
        }))
      ];

      // Remove the separate relations arrays to clean up the response
      const { sourceRelations, targetRelations, ...entityData } = deserializedEntity;

      return {
        success: true,
        data: {
          ...entityData,
          relationships
        }
      };
    } catch (error) {
      console.error('Error fetching entity:', error);
      return {
        success: false,
        error: `Failed to fetch entity: ${error.message}`
      };
    }
  }

  /**
   * Update an existing entity
   */
  static async updateEntity(id: string, data: Partial<CreatePhilosophicalEntityDTO>) {
    try {
      // Process data for update
      const processedData = { ...data };

      // Serialize keyTerms array if provided
      if (Array.isArray(processedData.keyTerms)) {
        processedData.keyTerms = serializeJsonForDb(processedData.keyTerms);
      }

      // Sanitize input data to prevent XSS
      const sanitizedData = this.sanitizeEntityData(processedData);

      // Validate if entity exists
      const existingEntity = await prisma.philosophicalEntity.findUnique({
        where: { id }
      });

      if (!existingEntity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      // Update the entity
      const entity = await prisma.philosophicalEntity.update({
        where: { id },
        data: sanitizedData
      });

      // Deserialize JSON fields for response
      const deserializedEntity = this.deserializeEntityData(entity);

      return {
        success: true,
        data: deserializedEntity
      };
    } catch (error) {
      console.error('Error updating entity:', error);
      return {
        success: false,
        error: `Failed to update entity: ${error.message}`
      };
    }
  }

  /**
   * Delete an entity
   */
  static async deleteEntity(id: string) {
    try {
      // Check if entity exists
      const entity = await prisma.philosophicalEntity.findUnique({
        where: { id }
      });

      if (!entity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      // Delete the entity (relationships will be cascade deleted due to schema setup)
      await prisma.philosophicalEntity.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Entity deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting entity:', error);
      return {
        success: false,
        error: `Failed to delete entity: ${error.message}`
      };
    }
  }

  /**
   * Create a relationship between entities
   */
  static async createRelationship(data: CreatePhilosophicalRelationDTO) {
    try {
      // Validate the relationship
      const validation = await this.validateRelationship(data);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid relationship: ${validation.errors.join(', ')}`
        };
      }

      // Serialize relationTypes array
      const relationshipData = {
        sourceEntityId: data.sourceEntityId,
        targetEntityId: data.targetEntityId,
        relationTypes: Array.isArray(data.relationTypes) ? serializeJsonForDb(data.relationTypes) : '[]',
        description: data.description || '',
        importance: data.importance || 3
      };

      // Create the relationship
      const relationship = await prisma.philosophicalRelation.create({
        data: relationshipData
      });

      // Deserialize for the response
      const deserializedRelationship = {
        ...relationship,
        relationTypes: deserializeJsonFromDb(relationship.relationTypes)
      };

      return {
        success: true,
        data: deserializedRelationship
      };
    } catch (error) {
      console.error('Error creating relationship:', error);
      return {
        success: false,
        error: `Failed to create relationship: ${error.message}`
      };
    }
  }

  /**
   * Update a relationship between entities
   */
  static async updateRelationship(id: string, data: {
    description?: string;
    importance?: number;
    relationTypes?: RelationType[];
  }) {
    try {
      // Check if the relationship exists
      const currentRelationship = await prisma.philosophicalRelation.findUnique({
        where: { id }
      });

      if (!currentRelationship) {
        return {
          success: false,
          error: 'Relationship not found'
        };
      }

      // Process data for update
      const updateData: any = {};

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.importance !== undefined) {
        updateData.importance = data.importance;
      }

      // Validate and serialize relationTypes if provided
      if (data.relationTypes) {
        // Prepare validation data
        const validationData = {
          sourceEntityId: currentRelationship.sourceEntityId,
          targetEntityId: currentRelationship.targetEntityId,
          relationTypes: data.relationTypes
        };

        // Validate the updated relationship
        const validation = await this.validateRelationship(validationData);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid relationship update: ${validation.errors.join(', ')}`
          };
        }

        // Serialize relationTypes
        updateData.relationTypes = serializeJsonForDb(data.relationTypes);
      }

      // Update the relationship
      const relationship = await prisma.philosophicalRelation.update({
        where: { id },
        data: updateData
      });

      // Deserialize for the response
      const deserializedRelationship = {
        ...relationship,
        relationTypes: deserializeJsonFromDb(relationship.relationTypes)
      };

      return {
        success: true,
        data: deserializedRelationship
      };
    } catch (error) {
      console.error('Error updating relationship:', error);
      return {
        success: false,
        error: `Failed to update relationship: ${error.message}`
      };
    }
  }

  /**
   * Delete a relationship
   */
  static async deleteRelationship(id: string) {
    try {
      // Check if relationship exists
      const relationship = await prisma.philosophicalRelation.findUnique({
        where: { id }
      });

      if (!relationship) {
        return {
          success: false,
          error: 'Relationship not found'
        };
      }

      // Delete the relationship
      await prisma.philosophicalRelation.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Relationship deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting relationship:', error);
      return {
        success: false,
        error: `Failed to delete relationship: ${error.message}`
      };
    }
  }

  /**
   * Get all relationships for an entity
   */
  static async getRelationshipsByEntityId(entityId: string) {
    try {
      // Check if entity exists
      const entity = await prisma.philosophicalEntity.findUnique({
        where: { id: entityId }
      });

      if (!entity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      // Get relationships where the entity is the source
      const sourceRelations = await prisma.philosophicalRelation.findMany({
        where: {
          sourceEntityId: entityId
        },
        include: {
          targetEntity: true
        }
      });

      // Get relationships where the entity is the target
      const targetRelations = await prisma.philosophicalRelation.findMany({
        where: {
          targetEntityId: entityId
        },
        include: {
          sourceEntity: true
        }
      });

      // Deserialize relationTypes and combine into a single array
      const relationships = [
        ...sourceRelations.map(r => ({
          ...r,
          relationTypes: deserializeJsonFromDb(r.relationTypes),
          direction: 'outgoing',
          relatedEntity: r.targetEntity
        })),
        ...targetRelations.map(r => ({
          ...r,
          relationTypes: deserializeJsonFromDb(r.relationTypes),
          direction: 'incoming',
          relatedEntity: r.sourceEntity
        }))
      ];

      return {
        success: true,
        data: relationships
      };
    } catch (error) {
      console.error('Error fetching relationships:', error);
      return {
        success: false,
        error: `Failed to fetch relationships: ${error.message}`
      };
    }
  }

  /**
   * Validate a relationship between entities
   */
  static async validateRelationship(data: {
    sourceEntityId: string;
    targetEntityId: string;
    relationTypes: RelationType[];
  }) {
    const errors = [];

    // Check for missing relation types
    if (!data.relationTypes || !Array.isArray(data.relationTypes) || data.relationTypes.length === 0) {
      errors.push('At least one relation type is required');
      return { valid: false, errors };
    }

    // Ensure entities exist
    const sourceEntity = await prisma.philosophicalEntity.findUnique({
      where: { id: data.sourceEntityId }
    });

    const targetEntity = await prisma.philosophicalEntity.findUnique({
      where: { id: data.targetEntityId }
    });

    if (!sourceEntity) {
      errors.push(`Invalid relationship: source entity not found (${data.sourceEntityId})`);
    }

    if (!targetEntity) {
      errors.push(`Invalid relationship: target entity not found (${data.targetEntityId})`);
    }

    // If either entity doesn't exist, return early
    if (!sourceEntity || !targetEntity) {
      return { valid: false, errors };
    }

    // Check for self-reference
    if (data.sourceEntityId === data.targetEntityId) {
      errors.push('Invalid relationship: an entity cannot have a relationship with itself');
    }

    // Validate relation types
    const validRelationTypes = Object.values(RelationType);
    for (const relationType of data.relationTypes) {
      if (!validRelationTypes.includes(relationType as RelationType)) {
        errors.push(`Invalid relationship: invalid relation type "${relationType}"`);
      }
    }

    // Validate semantic constraints based on entity types and relation types
    for (const relationType of data.relationTypes) {
      switch (relationType) {
        case RelationType.ADDRESSES_PROBLEMATIC:
          if (targetEntity.type !== 'Problematic') {
            errors.push('Invalid relationship: ADDRESSES_PROBLEMATIC relation requires target to be a Problematic');
          }
          break;
        case RelationType.DEVELOPMENT:
          if (sourceEntity.type !== 'Philosopher' && sourceEntity.type !== 'PhilosophicalConcept') {
            errors.push('Invalid relationship: DEVELOPMENT relation requires source to be a Philosopher or PhilosophicalConcept');
          }
          break;
        // Add more semantic validations as needed
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get prerequisites for a concept (hierarchical relationships)
   */
  static async getPrerequisites(conceptId: string) {
    try {
      const relations = await prisma.philosophicalRelation.findMany({
        where: {
          targetEntityId: conceptId,
          relationTypes: {
            contains: serializeJsonForDb([RelationType.HIERARCHICAL])
          }
        },
        include: {
          sourceEntity: true
        }
      });

      // Deserialize for the response
      const prerequisites = relations.map(r => ({
        ...r.sourceEntity,
        // Deserialize any JSON fields as needed
        keyTerms: deserializeJsonFromDb(r.sourceEntity.keyTerms)
      }));

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
   * Get a complete learning path to a target concept
   * This uses topological sorting to create a valid learning sequence
   */
  static async getLearningPath(targetConceptId: string) {
    try {
      // First, ensure the target concept exists
      const targetConcept = await prisma.philosophicalEntity.findUnique({
        where: { id: targetConceptId }
      });

      if (!targetConcept) {
        return {
          success: false,
          error: 'Target concept not found'
        };
      }

      // We'll use a recursive approach to build a dependency graph
      // and then perform topological sorting

      // This Set tracks concepts we've already processed to avoid cycles
      const visited = new Set<string>();
      // This Map will store each concept along with its direct prerequisites
      const dependencyGraph = new Map<string, string[]>();
      // This array will store all concept IDs in our learning path
      const conceptIds: string[] = [];

      // Recursive function to build the dependency graph
      async function buildDependencyGraph(conceptId: string): Promise<void> {
        // Skip if already visited to prevent cycles
        if (visited.has(conceptId)) {
          return;
        }

        visited.add(conceptId);
        conceptIds.push(conceptId);

        // Get prerequisites for this concept
        const prerequisites = await prisma.philosophicalRelation.findMany({
          where: {
            targetEntityId: conceptId,
            relationTypes: {
              contains: serializeJsonForDb([RelationType.HIERARCHICAL])
            }
          },
          include: {
            sourceEntity: true
          }
        });

        // Store the prerequisite IDs
        const prerequisiteIds = prerequisites.map(p => p.sourceEntityId);
        dependencyGraph.set(conceptId, prerequisiteIds);

        // Recursively process prerequisites
        for (const prerequisiteId of prerequisiteIds) {
          await buildDependencyGraph(prerequisiteId);
        }
      }

      // Build the graph starting from our target concept
      await buildDependencyGraph(targetConceptId);

      // Perform topological sort
      const sortedIds: string[] = [];
      const temporaryMarked = new Set<string>();
      const permanentMarked = new Set<string>();

      async function topologicalSort(conceptId: string): Promise<void> {
        if (permanentMarked.has(conceptId)) {
          return;
        }
        if (temporaryMarked.has(conceptId)) {
          // Cycle detected, but we'll continue
          return;
        }

        temporaryMarked.add(conceptId);

        const prerequisites = dependencyGraph.get(conceptId) || [];
        for (const prerequisiteId of prerequisites) {
          await topologicalSort(prerequisiteId);
        }

        temporaryMarked.delete(conceptId);
        permanentMarked.add(conceptId);
        sortedIds.push(conceptId);
      }

      // Sort all concepts in our graph
      for (const conceptId of conceptIds) {
        await topologicalSort(conceptId);
      }

      // Fetch the full concept objects for the sorted IDs
      const concepts = [];
      for (const id of sortedIds) {
        const concept = await prisma.philosophicalEntity.findUnique({
          where: { id }
        });
        if (concept) {
          // Deserialize JSON fields
          const deserializedConcept = this.deserializeEntityData(concept);
          concepts.push(deserializedConcept);
        }
      }

      return {
        success: true,
        data: concepts
      };
    } catch (error) {
      console.error('Error creating learning path:', error);
      return {
        success: false,
        error: `Failed to create learning path: ${error.message}`
      };
    }
  }

  /**
   * Sanitize entity data to prevent XSS
   * Private helper method
   */
  private static sanitizeEntityData(data: any): any {
    const sanitized = { ...data };

    // Basic XSS protection - replace script tags
    if (typeof sanitized.name === 'string') {
      sanitized.name = sanitized.name.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Add more sanitization as needed for other fields

    return sanitized;
  }

  /**
   * Deserialize JSON fields from entity data
   * Private helper method
   */
  private static deserializeEntityData(entity: any): any {
    // Create a copy to avoid modifying the original
    const deserialized = { ...entity };

    // Deserialize keyTerms if it exists
    if (deserialized.keyTerms) {
      deserialized.keyTerms = deserializeJsonFromDb(deserialized.keyTerms);
    }

    // Handle sourceRelations and targetRelations if they exist
    if (Array.isArray(deserialized.sourceRelations)) {
      deserialized.sourceRelations = deserialized.sourceRelations.map(relation => ({
        ...relation,
        relationTypes: deserializeJsonFromDb(relation.relationTypes)
      }));
    }

    if (Array.isArray(deserialized.targetRelations)) {
      deserialized.targetRelations = deserialized.targetRelations.map(relation => ({
        ...relation,
        relationTypes: deserializeJsonFromDb(relation.relationTypes)
      }));
    }

    return deserialized;
  }
}
