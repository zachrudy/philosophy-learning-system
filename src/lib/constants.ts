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

export const PROGRESS_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  READY_FOR_REFLECTION: "READY_FOR_REFLECTION",
  REFLECTION_SUBMITTED: "REFLECTION_SUBMITTED",
  MASTERY_DEMONSTRATED: "MASTERY_DEMONSTRATED",
  COMPLETED: "COMPLETED"
} as const;

export type ProgressStatus = keyof typeof PROGRESS_STATUS;

export const PROMPT_TYPES = {
  UNDERSTANDING: "UNDERSTANDING",
  APPLICATION: "APPLICATION",
  ANALYSIS: "ANALYSIS",
  SYNTHESIS: "SYNTHESIS",
  EVALUATION: "EVALUATION"
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

export const ONTOLOGICAL_POSITIONS = {
  ONE_WORLD: "ONE_WORLD",
  TWO_WORLD: "TWO_WORLD"
} as const;

export type OntologicalPosition = keyof typeof ONTOLOGICAL_POSITIONS;

/**
 * Helper function to serialize JSON data for SQLite storage
 */
export function serializeJsonForDb(data: any): string {
  return JSON.stringify(data);
}

/**
 * Helper function to deserialize JSON data from SQLite storage
 */
export function deserializeJsonFromDb<T>(jsonString: string | null): T | null {
  if (!jsonString) return null;
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
  return JSON.stringify(types);
}

/**
 * Helper function to deserialize relationTypes
 */
export function deserializeRelationTypes(jsonString: string | null): RelationType[] {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString) as RelationType[];
  } catch (error) {
    console.error('Error deserializing relation types:', error);
    return [];
  }
}
