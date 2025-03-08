// src/types/models/index.ts
import {
  User,
  Lecture,
  Progress,
  Reflection,
  PhilosophicalEntity,
  PhilosophicalRelation,
  LecturePrerequisite,
  LectureEntityRelation
} from '@prisma/client';

import {
  UserRole,
  ProgressStatus,
  PromptType,
  RelationType,
  LectureEntityRelationType
} from '@/lib/constants';

import { OntologicalPosition } from '@/lib/constants';

// Re-export Prisma types
export type {
  User,
  Lecture,
  Progress,
  Reflection,
  PhilosophicalEntity,
  PhilosophicalRelation,
  LecturePrerequisite,
  LectureEntityRelation
};

// Export our type definitions for the string enums
export type { UserRole, ProgressStatus, PromptType, RelationType, LectureEntityRelationType };

// Define the LectureEntityRelationType enum (to be added to constants.ts)
// export enum LectureEntityRelationType {
//   INTRODUCES = "INTRODUCES",
//   EXPANDS = "EXPANDS",
//   CRITIQUES = "CRITIQUES",
//   APPLIES = "APPLIES",
//   CONTEXTUALIZES = "CONTEXTUALIZES",
//   COMPARES = "COMPARES"
// }

// Extended types with relations
export type PhilosophicalEntityWithRelations = PhilosophicalEntity & {
  sourceRelations?: Array<PhilosophicalRelation>;
  targetRelations?: Array<PhilosophicalRelation>;
  lectureRelations?: Array<LectureEntityRelation>;
  lecture?: Lecture;
};

export type LectureWithRelations = Lecture & {
  entities?: Array<PhilosophicalEntity>;
  entityRelations?: Array<LectureEntityRelation>;
  prerequisites?: Array<{
    id: string;
    prerequisiteLectureId: string;
    prerequisiteLecture: Lecture;
    isRequired: boolean;
    importanceLevel: number;
  }>;
  prerequisiteFor?: Array<{
    id: string;
    lectureId: string;
    lecture: Lecture;
    isRequired: boolean;
    importanceLevel: number;
  }>;
  progress?: Array<Progress>;
  reflections?: Array<Reflection>;
};

export type LectureEntityRelationWithRelations = LectureEntityRelation & {
  lecture: Lecture;
  entity: PhilosophicalEntity;
};

export type UserWithProgress = User & {
  progress?: Array<Progress>;
  reflections?: Array<Reflection>;
};

// Reflection with parsed AI evaluation
export type ReflectionWithEvaluation = Reflection & {
  parsedEvaluation?: {
    score: number;
    feedback: string;
    areas: {
      strength: string[];
      improvement: string[];
    };
    conceptualUnderstanding: number;
    criticalThinking: number;
  } | null;
};

// DTO types (Data Transfer Objects)
export type CreateLectureDTO = {
  title: string;
  description: string;
  contentUrl: string;
  lecturerName: string;
  contentType: string;
  category: string;
  order: number;
  embedAllowed?: boolean;
  sourceAttribution: string;

  // Add new prompt fields
  preLecturePrompt: string;
  initialPrompt: string;
  masteryPrompt: string;
  evaluationPrompt: string;
  discussionPrompts: string;

  entityIds?: string[];
  entityRelations?: Array<{
    entityId: string;
    relationType: LectureEntityRelationType;
  }>;
  prerequisiteIds?: Array<{
    id: string;
    isRequired?: boolean;
    importanceLevel?: number;
  }>;
};

export type UpdateLectureDTO = Partial<CreateLectureDTO>;

export type LecturePrerequisiteDTO = {
  lectureId: string;
  prerequisiteLectureId: string;
  isRequired?: boolean;
  importanceLevel?: number;
};

export type LectureEntityRelationDTO = {
  lectureId: string;
  entityId: string;
  relationType: LectureEntityRelationType;
};

export type CreatePhilosophicalEntityDTO = {
  type: string;
  name: string;
  description: string;
  startYear?: number | null;
  endYear?: number | null;
  // Type-specific fields
  birthplace?: string;
  nationality?: string;
  biography?: string;
  ontologicalPosition?: OntologicalPosition;
  primaryText?: string;
  keyTerms?: string[];
  centralQuestion?: string;
  stillRelevant?: boolean;
  scope?: string;
  geographicalFocus?: string;
  historicalContext?: string;
};

export type CreatePhilosophicalRelationDTO = {
  sourceEntityId: string;
  targetEntityId: string;
  relationTypes: RelationType[];
  description?: string;
  importance?: number;
};

export type CreateReflectionDTO = {
  userId: string;
  lectureId: string;
  promptType: PromptType; // Updated to use promptType directly
  content: string;
};

export type UpdateProgressDTO = {
  userId: string;
  lectureId: string;
  status: ProgressStatus;
  lastViewed?: Date;
  completedAt?: Date;
  decayFactor?: number;
};
