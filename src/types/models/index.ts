// src/types/models/index.ts
import {
  User,
  Concept,
  Lecture,
  Progress,
  Reflection,
  ReflectionPrompt,
  PhilosophicalEntity,
  PhilosophicalRelation,
  LecturePrerequisite
} from '@prisma/client';

import {
  UserRole,
  ProgressStatus,
  PromptType,
  RelationType
} from '@/lib/constants';

import { OntologicalPosition } from '@/lib/constants';


// Re-export Prisma types
export type {
  User,
  Concept,
  Lecture,
  Progress,
  Reflection,
  ReflectionPrompt,
  PhilosophicalEntity,
  PhilosophicalRelation,
  LecturePrerequisite
};

// Export our type definitions for the string enums
export type { UserRole, ProgressStatus, PromptType, RelationType };

// Extended types with relations
export type ConceptWithRelations = Concept & {
  prerequisites?: Array<Concept>;
  dependentConcepts?: Array<Concept>;
  lectures?: Array<Lecture>;
  reflectionPrompts?: Array<ReflectionPrompt>;
};

export type PhilosophicalEntityWithRelations = PhilosophicalEntity & {
  sourceRelations?: Array<PhilosophicalRelation>;
  targetRelations?: Array<PhilosophicalRelation>;
  lectures?: Array<Lecture>;
  reflectionPrompts?: Array<ReflectionPrompt>;
};

export type LectureWithRelations = Lecture & {
  entities?: Array<PhilosophicalEntity>;
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

export type UserWithProgress = User & {
  progress?: Array<Progress>;
  reflections?: Array<Reflection>;
};

// DTO types (Data Transfer Objects)
export type CreateConceptDTO = {
  name: string;
  description: string;
  prerequisiteIds?: string[];
};

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
  initialPrompt: string;
  masteryPrompt: string;
  evaluationPrompt: string;
  entityIds?: string[];
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

export type CreatePhilosophicalEntityDTO = {
  type: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
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
  promptId: string;
  content: string;
};

export type UpdateProgressDTO = {
  userId: string;
  lectureId?: string;
  conceptId?: string;
  status: ProgressStatus;
};
