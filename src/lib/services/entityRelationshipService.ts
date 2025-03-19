// src/lib/services/entityRelationshipService.ts
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { validateEntityRelationships } from '@/lib/validation/entityRelationshipValidation';
import { LectureEntityRelationDTO } from '@/types/models';

/**
 * Service for managing entity relationships
 */
export class EntityRelationshipService {
  /**
     * Fetches entity relationships for a lecture
     * Includes a cache mechanism to prevent redundant API calls
     */
    static async getRelationshipsForLecture(lectureId: string): Promise<LectureEntityRelationDTO[]> {
      // Use a static cache to prevent redundant API calls during the same session
      if (!this._relationshipCache) {
        this._relationshipCache = new Map<string, {
          timestamp: number;
          data: LectureEntityRelationDTO[];
        }>();
      }

      // Check if we have cached data that's less than 30 seconds old
      const cached = this._relationshipCache.get(lectureId);
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        return cached.data;
      }

      try {
        const response = await fetch(`/api/lectures/${lectureId}/entity-relations`);

        if (!response.ok) {
          throw new Error('Failed to fetch entity relationships');
        }

        const data = await response.json();
        const relationships = (data.data || []).map((relation: any) => ({
          entityId: relation.entityId,
          relationType: relation.relationType
        }));

        // Store in cache
        this._relationshipCache.set(lectureId, {
          timestamp: Date.now(),
          data: relationships
        });

        return relationships;
      } catch (error) {
        console.error('Error fetching entity relationships:', error);
        return [];
      }
    }

    // Static cache for relationship data
    private static _relationshipCache: Map<string, {
      timestamp: number;
      data: LectureEntityRelationDTO[];
    }>;


  /**
   * Updates entity relationships for a lecture
   */
  static async updateRelationships(
    lectureId: string,
    relationships: LectureEntityRelationDTO[]
  ): Promise<{
    success: boolean;
    data?: LectureEntityRelationDTO[];
    error?: string;
  }> {
    try {
      // Validate relationships before sending
      const validation = validateEntityRelationships(relationships);

      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Ensure each relationship has the lectureId
      const dataToSend = validation.sanitizedData.map(rel => ({
        ...rel,
        lectureId
      }));

      const response = await fetch(`/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred while updating relationships');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error updating entity relationships:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  /**
   * Deletes a specific entity relationship
   */
  static async deleteRelationship(
    lectureId: string,
    relationId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/entity-relations/${relationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred while deleting the relationship');
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting entity relationship:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  /**
   * Gets a list of lectures that reference a specific entity
   * This supports the "reverse relationships" feature
   */
  static async getLecturesByEntity(entityId: string): Promise<any[]> {
    try {
      // This would be implemented in the future when adding the reverse relationship feature
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error fetching lectures by entity:', error);
      return [];
    }
  }

  /**
   * Gets relationship type display name
   */
  static getRelationTypeDisplayName(relationType: string): string {
    // Convert from "introduces" to "Introduces"
    return relationType.charAt(0).toUpperCase() + relationType.slice(1);
  }

  /**
   * Gets all valid relationship types
   */
  static getRelationTypes(): { key: string; value: string; display: string }[] {
    return Object.entries(LECTURE_ENTITY_RELATION_TYPES).map(([key, value]) => ({
      key,
      value,
      display: key.replace(/_/g, ' ').toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }));
  }
}
