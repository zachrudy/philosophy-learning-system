import {
  User,
  Concept,
  Lecture,
  Progress,
  Reflection,
  ReflectionPrompt,
  WatchPoint
} from '@prisma/client';

import {
  UserRole,
  ProgressStatus,
  PromptType
} from '@/lib/constants';

// Re-export Prisma types
export type {
  User,
  Concept,
  Lecture,
  Progress,
  Reflection,
  ReflectionPrompt,
  WatchPoint
};

// Export our type definitions for the string enums
export type { UserRole, ProgressStatus, PromptType };

// Extended types with relations
export type ConceptWithRelations = Concept & {
  prerequisites?: Array<Concept>;
  dependentConcepts?: Array<Concept>;
  lectures?: Array<Lecture>;
  reflectionPrompts?: Array<ReflectionPrompt>;
};

export type LectureWithRelations = Lecture & {
  concepts?: Array<Concept>;
  watchPoints?: Array<WatchPoint>;
};

export type UserWithProgress = User & {
  progress?: Array<Progress>;
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
  videoUrl: string;
  duration: number;
  order: number;
  conceptIds: string[];
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
