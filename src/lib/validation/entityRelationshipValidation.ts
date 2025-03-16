// src/lib/validation/entityRelationshipValidation.ts
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { LectureEntityRelationDTO } from '@/types/models';

/**
 * Validates that a relation type is one of the allowed values
 */
 export function validateRelationType(relationType: string): boolean {
   if (!relationType) return false;

   // Case-insensitive comparison
   const normalizedType = relationType.toLowerCase();
   const validTypes = Object.values(LECTURE_ENTITY_RELATION_TYPES).map(type =>
     typeof type === 'string' ? type.toLowerCase() : type
   );

   return validTypes.includes(normalizedType);
 }

/**
 * Normalizes a relation type to ensure it matches one of the allowed values
 * If the type doesn't match, returns the default 'introduces' type
 */
export function normalizeRelationType(relationType: string): string {
  if (!relationType) return LECTURE_ENTITY_RELATION_TYPES.INTRODUCES;

  // Case-insensitive validation
  const normalizedType = relationType.toLowerCase();

  // Check for exact match first (case-insensitive)
  for (const [key, value] of Object.entries(LECTURE_ENTITY_RELATION_TYPES)) {
    if (typeof value === 'string' && value.toLowerCase() === normalizedType) {
      return value; // Return the properly cased version from constants
    }
  }

  // Return the default type if no match
  return LECTURE_ENTITY_RELATION_TYPES.INTRODUCES;
}

/**
 * Validates a single entity relationship
 */
export function validateEntityRelationship(
  relationship: Partial<LectureEntityRelationDTO>
): {
  valid: boolean;
  errors: string[];
  sanitizedData?: Partial<LectureEntityRelationDTO>;
} {
  const errors: string[] = [];
  const sanitizedData: Partial<LectureEntityRelationDTO> = { ...relationship };

  // Check required fields
  if (!relationship.entityId) {
    errors.push('Entity ID is required');
  }

  if (!relationship.relationType) {
    errors.push('Relation type is required');
  } else {
    // Always normalize the relation type
    const normalizedType = normalizeRelationType(relationship.relationType);

    // If the normalized type doesn't match the original (case-insensitive), it's invalid
    if (normalizedType.toLowerCase() !== relationship.relationType.toLowerCase()) {
      errors.push(`Invalid relation type: "${relationship.relationType}"`);
    }

    // Always set the normalized type in sanitized data
    sanitizedData.relationType = normalizedType;
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validates an array of entity relationships
 */
export function validateEntityRelationships(
  relationships: Partial<LectureEntityRelationDTO>[]
): {
  valid: boolean;
  errors: string[];
  sanitizedData?: Partial<LectureEntityRelationDTO>[];
} {
  const errors: string[] = [];
  const sanitizedData: Partial<LectureEntityRelationDTO>[] = [];

  // Check if we have any relationships at all
  if (!relationships || relationships.length === 0) {
    return {
      valid: true,
      errors: [],
      sanitizedData: []
    };
  }

  // Validate each relationship
  relationships.forEach((relationship, index) => {
    const validation = validateEntityRelationship(relationship);

    if (!validation.valid) {
      validation.errors.forEach(error => {
        errors.push(`Relationship #${index + 1}: ${error}`);
      });
    }

    sanitizedData.push(validation.sanitizedData || {});
  });

  // Check for duplicate relationships (same entity + relation type, case-insensitive)
  const seenCombinations = new Set<string>();
  relationships.forEach((relationship, index) => {
    if (relationship.entityId && relationship.relationType) {
      const key = `${relationship.entityId}|${relationship.relationType.toLowerCase()}`;
      if (seenCombinations.has(key)) {
        errors.push(`Relationship #${index + 1}: Duplicate entity-relation type combination`);
      } else {
        seenCombinations.add(key);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Checks if adding a relationship would create semantic inconsistencies
 * This is for future enhancements - currently returns always valid
 */
export function checkRelationshipConsistency(
  entityId: string,
  relationType: string,
  existingRelationships: LectureEntityRelationDTO[]
): {
  consistent: boolean;
  warnings: string[];
} {
  // This function can be expanded in the future to implement domain-specific rules
  return {
    consistent: true,
    warnings: []
  };
}
