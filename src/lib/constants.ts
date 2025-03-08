/**
 * Constants for model values that would normally be enums in PostgreSQL
 * Using string constants since SQLite doesn't support enums
 */

export const USER_ROLES = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT"
} as const;

export type UserRole = keyof typeof USER_ROLES;

// Updated with expanded status options from schema
export const PROGRESS_STATUS = {
  LOCKED: "LOCKED",
  READY: "READY",
  STARTED: "STARTED",
  WATCHED: "WATCHED",
  INITIAL_REFLECTION: "INITIAL_REFLECTION",
  MASTERY_TESTING: "MASTERY_TESTING",
  MASTERED: "MASTERED"
} as const;

export type ProgressStatus = keyof typeof PROGRESS_STATUS;

// Updated to match the new promptType field in Reflection model
export const PROMPT_TYPES = {
  PRE_LECTURE: "pre-lecture",
  INITIAL: "initial",
  MASTERY: "mastery",
  DISCUSSION: "discussion"
} as const;

export type PromptType = keyof typeof PROMPT_TYPES;

// Define relation types as constants since we can't use enums with SQLite
export const RELATION_TYPES = {
  HIERARCHICAL: "HIERARCHICAL",
  HISTORICAL_INFLUENCE: "HISTORICAL_INFLUENCE",
  LOGICAL_CONNECTION: "LOGICAL_CONNECTION",
  ADDRESSES_PROBLEMATIC: "ADDRESSES_PROBLEMATIC",
  BELONGS_TO: "BELONGS_TO",
  TEMPORAL_SUCCESSION: "TEMPORAL_SUCCESSION",
  CONTRADICTION: "CONTRADICTION",
  DEVELOPMENT: "DEVELOPMENT"
} as const;

export type RelationType = keyof typeof RELATION_TYPES;

// New constant for lecture-entity relation types
export const LECTURE_ENTITY_RELATION_TYPES = {
  INTRODUCES: "introduces",
  EXPANDS: "expands",
  CRITIQUES: "critiques",
  APPLIES: "applies",
  CONTEXTUALIZES: "contextualizes",
  COMPARES: "compares"
} as const;

export type LectureEntityRelationType = keyof typeof LECTURE_ENTITY_RELATION_TYPES;

// Reflection status types
export const REFLECTION_STATUS = {
  SUBMITTED: "SUBMITTED",
  EVALUATED: "EVALUATED",
  MASTERY_ACHIEVED: "MASTERY_ACHIEVED"
} as const;

export type ReflectionStatus = keyof typeof REFLECTION_STATUS;

export const ONTOLOGICAL_POSITIONS = {
  ONE_WORLD: "ONE_WORLD",
  TWO_WORLD: "TWO_WORLD"
} as const;

export type OntologicalPosition = keyof typeof ONTOLOGICAL_POSITIONS;

/**
 * Helper function to serialize JSON data for SQLite storage
 */
export function serializeJsonForDb(data: any): string {
  if (data === undefined || data === null) {
    return '';
  }

  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error serializing data for DB:', error);
    return '';
  }
}

/**
 * Helper function to deserialize JSON data from SQLite storage
 */
export function deserializeJsonFromDb<T>(jsonString: string | null): T | null {
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error deserializing JSON from database:', error);
    return null;
  }
}

/**
 * Helper function to handle relationTypes specifically
 */
export function serializeRelationTypes(types: RelationType[]): string {
  return serializeJsonForDb(types);
}

/**
 * Helper function to deserialize relationTypes
 */
export function deserializeRelationTypes(jsonString: string | null): RelationType[] {
  if (!jsonString) {
    return [];
  }

  try {
    return JSON.parse(jsonString) as RelationType[];
  } catch (error) {
    console.error('Error deserializing relation types:', error);
    return [];
  }
}
