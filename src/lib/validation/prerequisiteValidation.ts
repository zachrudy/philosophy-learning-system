// src/lib/validation/prerequisiteValidation.ts

import { LecturePrerequisiteDTO } from '@/types/models';

/**
 * Validates importance level (1-5 scale)
 */
export function validateImportanceLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

/**
 * Normalizes importance level to be within valid range
 */
export function normalizeImportanceLevel(level: number | undefined): number {
  if (level === undefined) return 3; // Default value

  // Ensure it's an integer
  const normalizedLevel = Math.round(level);

  // Clamp within range 1-5
  return Math.max(1, Math.min(5, normalizedLevel));
}

/**
 * Validates isRequired flag
 */
export function validateIsRequired(value: any): boolean {
  return typeof value === 'boolean';
}

/**
 * Normalizes isRequired to be a boolean
 */
export function normalizeIsRequired(value: any): boolean {
  if (value === undefined) return true; // Default value
  return Boolean(value);
}

/**
 * Validates a prerequisite relationship
 */
export function validatePrerequisite(data: Partial<LecturePrerequisiteDTO>, isUpdate = false): {
  valid: boolean;
  errors: string[];
  sanitizedData?: Partial<LecturePrerequisiteDTO>;
} {
  const errors: string[] = [];
  const sanitizedData: Partial<LecturePrerequisiteDTO> = { ...data };

  // In create mode, these fields are required
  if (!isUpdate) {
    if (!data.lectureId) {
      errors.push('Lecture ID is required');
    }

    if (!data.prerequisiteLectureId) {
      errors.push('Prerequisite lecture ID is required');
    }
  }

  // Check for self-referencing
  if (data.lectureId === data.prerequisiteLectureId && data.lectureId) {
    errors.push('A lecture cannot be a prerequisite of itself');
  }

  // Validate importance level if provided
  if (data.importanceLevel !== undefined) {
    if (!validateImportanceLevel(data.importanceLevel)) {
      errors.push('Importance level must be an integer between 1 and 5');
    } else {
      sanitizedData.importanceLevel = normalizeImportanceLevel(data.importanceLevel);
    }
  }

  // Validate isRequired if provided
  if (data.isRequired !== undefined) {
    sanitizedData.isRequired = normalizeIsRequired(data.isRequired);
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData
  };
}
