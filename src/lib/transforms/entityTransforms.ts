// src/lib/transforms/entityTransforms.ts
import {
  PhilosophicalEntity,
  PhilosophicalEntityWithRelations,
  PhilosophicalRelation
} from '@/types/models';
import { deserializeJsonFromDb } from '@/lib/constants';
import { transformLecture, transformLectureEntityRelation } from './lectureTransforms';
import { transformArray } from './baseTransforms';

/**
 * Transform a Philosophical Entity from database model to API response
 */
export function transformPhilosophicalEntity(
  entity: PhilosophicalEntity | null
): PhilosophicalEntity | null {
  if (!entity) return null;

  return {
    ...entity,
    // Deserialize JSON fields
    keyTerms: deserializeJsonFromDb(entity.keyTerms)
  };
}

/**
 * Transform a Philosophical Entity with relations from database model to API response
 */
export function transformPhilosophicalEntityWithRelations(
  entity: PhilosophicalEntityWithRelations | null
): PhilosophicalEntityWithRelations | null {
  if (!entity) return null;

  const transformedEntity = transformPhilosophicalEntity(entity) as PhilosophicalEntityWithRelations;

  // Transform relations if they exist
  if (entity.sourceRelations) {
    transformedEntity.sourceRelations = transformArray(entity.sourceRelations, transformPhilosophicalRelation);
  }

  if (entity.targetRelations) {
    transformedEntity.targetRelations = transformArray(entity.targetRelations, transformPhilosophicalRelation);
  }

  if (entity.lectureRelations) {
    transformedEntity.lectureRelations = transformArray(entity.lectureRelations, transformLectureEntityRelation);
  }

  if (entity.lecture) {
    transformedEntity.lecture = transformLecture(entity.lecture);
  }

  return transformedEntity;
}

/**
 * Transform a Philosophical Relation from database model to API response
 */
export function transformPhilosophicalRelation(
  relation: PhilosophicalRelation | null
): PhilosophicalRelation | null {
  if (!relation) return null;

  const transformed = {
    ...relation,
    // Deserialize JSON fields
    relationTypes: deserializeJsonFromDb(relation.relationTypes) || []
  };

  // Transform related entities if they exist
  if ('sourceEntity' in relation && relation.sourceEntity) {
    transformed.sourceEntity = transformPhilosophicalEntity(relation.sourceEntity);
  }

  if ('targetEntity' in relation && relation.targetEntity) {
    transformed.targetEntity = transformPhilosophicalEntity(relation.targetEntity);
  }

  return transformed;
}

/**
 * Transform a relationship with direction information
 */
export function transformRelationshipWithDirection(relationship: {
  id: string;
  direction: 'incoming' | 'outgoing';
  relationTypes: string[];
  description?: string;
  relatedEntity: PhilosophicalEntity;
  [key: string]: any;
} | null) {
  if (!relationship) return null;

  const transformed = { ...relationship };

  // Transform the related entity
  if (transformed.relatedEntity) {
    transformed.relatedEntity = transformPhilosophicalEntity(transformed.relatedEntity);
  }

  return transformed;
}
