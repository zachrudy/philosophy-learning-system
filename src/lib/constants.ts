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
