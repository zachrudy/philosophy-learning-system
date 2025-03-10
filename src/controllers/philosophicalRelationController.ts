// src/controllers/philosophicalRelationController.ts

import { prisma } from '@/lib/db/prisma';
import { RELATION_TYPES, RelationType, serializeJsonForDb } from '@/lib/constants';
import { CreatePhilosophicalRelationDTO } from '@/types/models';

// Import transform functions
import {
  transformPhilosophicalRelation,
  transformRelationshipWithDirection,
  transformPhilosophicalEntity,
  createApiResponse,
  transformArray,
  createTransformedResponse
} from '@/lib/transforms';

/**
 * Controller for managing relationships between philosophical entities
 */
export class PhilosophicalRelationController {
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
        data: relationshipData,
        include: {
          sourceEntity: true,
          targetEntity: true
        }
      });

      // Transform the relationship data for the response
      const transformedRelationship = transformPhilosophicalRelation(relationship);

      return {
        success: true,
        data: transformedRelationship
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
        data: updateData,
        include: {
          sourceEntity: true,
          targetEntity: true
        }
      });

      // Transform the relationship for the response
      const transformedRelationship = transformPhilosophicalRelation(relationship);

      return {
        success: true,
        data: transformedRelationship
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

      // Process relations to add direction and combine into a single array
      const sourceRelationsWithDirection = sourceRelations.map(relation => ({
        ...relation,
        direction: 'outgoing' as const,
        relatedEntity: relation.targetEntity
      }));

      const targetRelationsWithDirection = targetRelations.map(relation => ({
        ...relation,
        direction: 'incoming' as const,
        relatedEntity: relation.sourceEntity
      }));

      // Combine and transform the relationships using the transform functions
      const relationships = [
        ...transformArray(sourceRelationsWithDirection, transformRelationshipWithDirection),
        ...transformArray(targetRelationsWithDirection, transformRelationshipWithDirection)
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
   * Get a specific relationship by ID
   */
  static async getRelationshipById(id: string) {
    try {
      const relationship = await prisma.philosophicalRelation.findUnique({
        where: { id },
        include: {
          sourceEntity: true,
          targetEntity: true
        }
      });

      if (!relationship) {
        return {
          success: false,
          error: 'Relationship not found'
        };
      }

      // Transform the relationship data
      const transformedRelationship = transformPhilosophicalRelation(relationship);

      return {
        success: true,
        data: transformedRelationship
      };
    } catch (error) {
      console.error('Error fetching relationship:', error);
      return {
        success: false,
        error: `Failed to fetch relationship: ${error.message}`
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
    const validRelationTypes = Object.keys(RELATION_TYPES);
    for (const relationType of data.relationTypes) {
      if (!validRelationTypes.includes(relationType)) {
        errors.push(`Invalid relationship: invalid relation type "${relationType}"`);
      }
    }

    // Validate semantic constraints based on entity types and relation types
    for (const relationType of data.relationTypes) {
      switch (relationType) {
        case 'ADDRESSES_PROBLEMATIC':
          if (targetEntity.type !== 'Problematic') {
            errors.push('Invalid relationship: ADDRESSES_PROBLEMATIC relation requires target to be a Problematic');
          }
          break;
        case 'DEVELOPMENT':
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
}
