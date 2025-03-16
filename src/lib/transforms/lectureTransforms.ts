// src/lib/transforms/lectureTransforms.ts
import {
  Lecture,
  LectureWithRelations,
  LectureEntityRelation,
  LecturePrerequisite,
  Progress,
  Reflection
} from '@/types/models';
import { deserializeJsonFromDb } from '@/lib/constants';
import { transformArray } from './baseTransforms';

// Forward declaration to handle circular dependencies
import { transformPhilosophicalEntity } from './entityTransforms';

import { transformReflection } from './reflectionTransforms';

/**
 * Transform a Lecture from database model to API response
 */
export function transformLecture(
  lecture: Lecture | null
): Lecture | null {
  if (!lecture) return null;

  return {
    ...lecture,
    // Add any lecture-specific transformations here
    // For example, formatting dates if needed
    createdAt: lecture.createdAt,
    updatedAt: lecture.updatedAt
  };
}

/**
 * Transform a Lecture with relations from database model to API response
 */
export function transformLectureWithRelations(
  lecture: LectureWithRelations | null
): LectureWithRelations | null {
  if (!lecture) return null;

  const transformedLecture = transformLecture(lecture) as LectureWithRelations;

  // Transform relations if they exist
  if (lecture.entities) {
    transformedLecture.entities = transformArray(lecture.entities, transformPhilosophicalEntity);
  }

  if (lecture.entityRelations) {
    transformedLecture.entityRelations = transformArray(lecture.entityRelations, transformLectureEntityRelation);
  }

  if (lecture.prerequisites) {
    transformedLecture.prerequisites = lecture.prerequisites.map(prereq => ({
      ...prereq,
      prerequisiteLecture: prereq.prerequisiteLecture ? transformLecture(prereq.prerequisiteLecture) : undefined
    }));
  }

  if (lecture.prerequisiteFor) {
    transformedLecture.prerequisiteFor = lecture.prerequisiteFor.map(prereq => ({
      ...prereq,
      lecture: prereq.lecture ? transformLecture(prereq.lecture) : undefined
    }));
  }

  if (lecture.progress) {
    transformedLecture.progress = transformArray(lecture.progress, transformProgress);
  }

  if (lecture.reflections) {
    transformedLecture.reflections = transformArray(lecture.reflections, transformReflection);
  }

  return transformedLecture;
}

/**
 * Transform a Lecture Entity Relation from database model to API response
 */
export function transformLectureEntityRelation(
  relation: LectureEntityRelation | null
): LectureEntityRelation | null {
  if (!relation) return null;

  const transformed = { ...relation };

  // Transform related entities if present
  if ('lecture' in relation && relation.lecture) {
    transformed.lecture = transformLecture(relation.lecture);
  }

  if ('entity' in relation && relation.entity) {
    transformed.entity = transformPhilosophicalEntity(relation.entity);
  }

  return transformed;
}

/**
 * Transform a Lecture Prerequisite from database model to API response
 */
export function transformLecturePrerequisite(
  prerequisite: LecturePrerequisite | null
): LecturePrerequisite | null {
  if (!prerequisite) return null;

  const transformed = { ...prerequisite };

  // Transform related lectures if present
  if ('lecture' in prerequisite && prerequisite.lecture) {
    transformed.lecture = transformLecture(prerequisite.lecture);
  }

  if ('prerequisiteLecture' in prerequisite && prerequisite.prerequisiteLecture) {
    transformed.prerequisiteLecture = transformLecture(prerequisite.prerequisiteLecture);
  }

  return transformed;
}

/**
 * Transform Progress data from database model to API response
 */
export function transformProgress(
  progress: Progress | null
): Progress | null {
  if (!progress) return null;

  return {
    ...progress,
    // Add any progress-specific transformations here
    // For example, formatting dates
    lastViewed: progress.lastViewed,
    completedAt: progress.completedAt
  };
}

// Make sure to also define the AIEvaluationData interface
export interface AIEvaluationData {
  score: number;
  feedback: string;
  areas: {
    strength: string[];
    improvement: string[];
  };
  conceptualUnderstanding: number;
  criticalThinking: number;
}

/**
 * Transform lecture availability data for student
 */
export function transformLectureAvailability(availabilityData: {
  lecture: Lecture;
  isCompleted: boolean;
  isInProgress: boolean;
  isAvailable: boolean;
  status: string;
  readinessScore: number;
  prerequisitesSatisfied: boolean;
  prerequisitesCount?: {
    required: number;
    recommended: number;
    completedRequired: number;
    completedRecommended: number;
  };
} | null) {
  if (!availabilityData) return null;

  // Transform the lecture
  return {
    ...availabilityData,
    lecture: transformLecture(availabilityData.lecture)
  };
}

/**
 * Transform prerequisite check result
 */
export function transformPrerequisiteCheckResult(checkResult: {
  satisfied: boolean;
  requiredPrerequisites?: any[];
  completedPrerequisites?: any[];
  missingRequiredPrerequisites?: any[];
  recommendedPrerequisites?: any[];
  completedRecommendedPrerequisites?: any[];
  readinessScore: number;
} | null) {
  if (!checkResult) return null;

  // Return the result with any necessary transformations
  return checkResult;
}
