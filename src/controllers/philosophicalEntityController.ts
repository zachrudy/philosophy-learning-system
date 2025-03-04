// src/controllers/philosophicalEntityController.ts

import { prisma } from '@/lib/db/prisma';
import { RelationType } from '@prisma/client';

/**
 * Controller for managing philosophical entities and their relationships
 */
export class PhilosophicalEntityController {
  /**
   * Create a new philosophical entity
   */
  static async createEntity(data: any) {
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

      // Create the entity
      const entity = await prisma.philosophicalEntity.create({
        data: {
          ...data
        }
      });

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

      // Transform the data to include all relationships in a single array
      const relationships = [
        ...entity.sourceRelations.map(r => ({
          ...r,
          direction: 'outgoing',
          relatedEntity: r.targetEntity
        })),
        ...entity.targetRelations.map(r => ({
          ...r,
          direction: 'incoming',
          relatedEntity: r.sourceEntity
        }))
      ];

      // Remove the separate relations arrays to clean up the response
      const { sourceRelations, targetRelations, ...entityData } = entity;

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
  static async updateEntity(id: string, data: any) {
    try {
      const entity = await prisma.philosophicalEntity.update({
        where: { id },
        data
      });

      return {
        success: true,
        data: entity
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
  static async createRelationship(data: {
    sourceEntityId: string;
    targetEntityId: string;
    relationTypes: RelationType[];
    description?: string;
    importance?: number;
  }) {
    try {
      // Validate the relationship
      const validation = await this.validateRelationship(data);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid relationship: ${validation.errors.join(', ')}`
        };
      }

      const relationship = await prisma.philosophicalRelation.create({
        data: {
          sourceEntityId: data.sourceEntityId,
          targetEntityId: data.targetEntityId,
          relationTypes: data.relationTypes,
          description: data.description || '',
          importance: data.importance || 3
        }
      });

      return {
        success: true,
        data: relationship
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
   * Get all relationships for an entity
   */
  static async getRelationshipsByEntityId(entityId: string) {
    try {
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

      // Combine and transform the relationships
      const relationships = [
        ...sourceRelations.map(r => ({
          ...r,
          direction: 'outgoing',
          relatedEntity: r.targetEntity
        })),
        ...targetRelations.map(r => ({
          ...r,
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
            hasSome: [RelationType.HIERARCHICAL]
          }
        },
        include: {
          sourceEntity: true
        }
      });

      const prerequisites = relations.map(r => r.sourceEntity);

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
              hasSome: [RelationType.HIERARCHICAL]
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
          concepts.push(concept);
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
}
