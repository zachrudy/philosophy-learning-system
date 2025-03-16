// src/lib/validation/entityRelationshipValidation.ts
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { LectureEntityRelationDTO } from '@/types/models';

/**
 * Validates that a relation type is one of the allowed values
 */
export function validateRelationType(relationType: string): boolean {
  return Object.values(LECTURE_ENTITY_RELATION_TYPES).includes(relationType);
}

/**
 * Normalizes a relation type to ensure it matches one of the allowed values
 * If the type doesn't match, returns the default 'introduces' type
 */
export function normalizeRelationType(relationType: string): string {
  if (validateRelationType(relationType)) {
    return relationType;
  }

  // Try to match by case-insensitive comparison
  const lowerRelationType = relationType.toLowerCase();
  const match = Object.values(LECTURE_ENTITY_RELATION_TYPES).find(type =>
    type.toLowerCase() === lowerRelationType
  );

  if (match) {
    return match;
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
  } else if (!validateRelationType(relationship.relationType)) {
    errors.push(`Invalid relation type: "${relationship.relationType}"`);
    // Still normalize the relation type for the sanitized data
    sanitizedData.relationType = normalizeRelationType(relationship.relationType);
  }

  // Lecture ID validation is handled by the caller or API layer

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

  // Check for duplicate relationships (same entity + relation type)
  const seenCombinations = new Set<string>();
  relationships.forEach((relationship, index) => {
    if (relationship.entityId && relationship.relationType) {
      const key = `${relationship.entityId}|${relationship.relationType}`;
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
  // For example:
  // - Warning if multiple lectures "introduce" the same concept
  // - Warning if a lecture "critiques" a concept without "introducing" it first

  // For now, we return always consistent with no warnings
  return {
    consistent: true,
    warnings: []
  };
}
