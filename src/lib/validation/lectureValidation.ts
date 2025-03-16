// src/lib/validation/lectureValidation.ts
import { CreateLectureDTO, UpdateLectureDTO } from '@/types/models';
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Validates a URL string
 */
 export function validateUrl(url: string): boolean {
   try {
     // Let the URL constructor handle validation
     new URL(url.startsWith('http') ? url : `https://${url}`);
     return true;
   } catch (error) {
     // If it's a relative URL, consider it valid
     if (url.startsWith('/')) {
       return true;
     }
     return false;
   }
 }

/**
 * Normalizes a URL - ensuring it has proper protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  // If URL is relative, return as is
  if (url.startsWith('/')) return url;

  // If URL doesn't have protocol, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

/**
 * Normalizes a string by trimming whitespace and sanitizing HTML
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  // Trim whitespace
  const trimmed = text.trim();

  // Sanitize HTML
  return purify.sanitize(trimmed);
}

/**
 * Checks for valid order value - must be a positive integer
 */
export function validateOrder(order: number): boolean {
  return Number.isInteger(order) && order >= 0;
}

/**
 * Validates a lecture creation/update object
 */
export function validateLecture(data: Partial<CreateLectureDTO>, isUpdate = false): {
  valid: boolean;
  errors: string[];
  sanitizedData?: Partial<CreateLectureDTO>;
} {
  const errors: string[] = [];
  const sanitizedData: Partial<CreateLectureDTO> = { ...data };

  // Only validate fields that are provided
  // In update mode, we only validate the fields that are being updated

  // Required fields - only check in create mode or if field is provided in update mode
  if (!isUpdate || data.title !== undefined) {
    if (!data.title?.trim()) {
      errors.push('Title is required');
    } else {
      sanitizedData.title = normalizeText(data.title);
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description?.trim()) {
      errors.push('Description is required');
    } else {
      sanitizedData.description = normalizeText(data.description);
    }
  }

  if (!isUpdate || data.contentUrl !== undefined) {
    if (!data.contentUrl?.trim()) {
      errors.push('Content URL is required');
    } else if (!validateUrl(data.contentUrl)) {
      errors.push('Invalid content URL format');
    } else {
      sanitizedData.contentUrl = normalizeUrl(data.contentUrl);
    }
  }

  if (!isUpdate || data.lecturerName !== undefined) {
    if (!data.lecturerName?.trim()) {
      errors.push('Lecturer name is required');
    } else {
      sanitizedData.lecturerName = normalizeText(data.lecturerName);
    }
  }

  if (!isUpdate || data.contentType !== undefined) {
    if (!data.contentType?.trim()) {
      errors.push('Content type is required');
    } else {
      sanitizedData.contentType = normalizeText(data.contentType);
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category?.trim()) {
      errors.push('Category is required');
    } else {
      sanitizedData.category = normalizeText(data.category);
    }
  }

  if (!isUpdate || data.sourceAttribution !== undefined) {
    if (!data.sourceAttribution?.trim()) {
      errors.push('Source attribution is required');
    } else {
      sanitizedData.sourceAttribution = normalizeText(data.sourceAttribution);
    }
  }

  // Validate prompt fields
  if (!isUpdate || data.preLecturePrompt !== undefined) {
    if (!data.preLecturePrompt?.trim()) {
      errors.push('Pre-lecture prompt is required');
    } else {
      sanitizedData.preLecturePrompt = normalizeText(data.preLecturePrompt);
    }
  }

  if (!isUpdate || data.initialPrompt !== undefined) {
    if (!data.initialPrompt?.trim()) {
      errors.push('Initial prompt is required');
    } else {
      sanitizedData.initialPrompt = normalizeText(data.initialPrompt);
    }
  }

  if (!isUpdate || data.masteryPrompt !== undefined) {
    if (!data.masteryPrompt?.trim()) {
      errors.push('Mastery prompt is required');
    } else {
      sanitizedData.masteryPrompt = normalizeText(data.masteryPrompt);
    }
  }

  if (!isUpdate || data.evaluationPrompt !== undefined) {
    if (!data.evaluationPrompt?.trim()) {
      errors.push('Evaluation prompt is required');
    } else {
      sanitizedData.evaluationPrompt = normalizeText(data.evaluationPrompt);
    }
  }

  if (!isUpdate || data.discussionPrompts !== undefined) {
    if (!data.discussionPrompts?.trim()) {
      errors.push('Discussion prompts are required');
    } else {
      sanitizedData.discussionPrompts = normalizeText(data.discussionPrompts);
    }
  }

  // Validate order if provided
  if (data.order !== undefined) {
    if (!validateOrder(data.order)) {
      errors.push('Order must be a positive integer');
    }
  }

  // Validate entity relations if provided
  if (data.entityRelations !== undefined) {
    // Get valid relation types in lowercase for case-insensitive comparison
    const validRelationTypes = Object.values(LECTURE_ENTITY_RELATION_TYPES).map(type =>
      typeof type === 'string' ? type.toLowerCase() : type
    );

    for (let i = 0; i < data.entityRelations.length; i++) {
      const relation = data.entityRelations[i];

      if (!relation.entityId) {
        errors.push(`Entity ID is required for relation at index ${i}`);
      }

      if (!relation.relationType) {
        errors.push(`Relation type is required for relation at index ${i}`);
      } else {
        // Case-insensitive comparison
        const normalizedType = relation.relationType.toLowerCase();
        if (!validRelationTypes.includes(normalizedType)) {
          errors.push(`Invalid relation type '${relation.relationType}' for relation at index ${i}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData
  };
}
