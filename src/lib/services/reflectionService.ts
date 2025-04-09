// src/lib/services/reflectionService.ts

import { PROMPT_TYPES } from '@/lib/constants';

// Interface for reflection submission
interface ReflectionSubmission {
  lectureId: string;
  promptType: string;
  content: string;
}

// Service for handling reflections
export const reflectionService = {
  /**
   * Submit a reflection
   * @param lectureId - The ID of the lecture
   * @param promptType - The type of reflection prompt
   * @param content - The reflection content
   * @returns Promise with success/error info
   */
  submitReflection: async (lectureId: string, promptType: string, content: string) => {
    try {
      // Validate inputs
      if (!lectureId) {
        return { success: false, error: 'Lecture ID is required' };
      }

      if (!promptType) {
        return { success: false, error: 'Prompt type is required' };
      }

      if (!content || content.trim() === '') {
        return { success: false, error: 'Content is required' };
      }

      // Validate prompt type
      const validPromptTypes = Object.values(PROMPT_TYPES);
      if (!validPromptTypes.includes(promptType)) {
        return {
          success: false,
          error: `Invalid prompt type. Must be one of: ${validPromptTypes.join(', ')}`
        };
      }

      // Submit the reflection via API
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lectureId,
          promptType,
          content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reflection');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting reflection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get reflections for a lecture
   * @param lectureId - The lecture ID
   * @param userId - Optional user ID filter
   * @param promptType - Optional prompt type filter
   * @returns Promise with reflections data
   */
  getLectureReflections: async (lectureId: string, userId?: string, promptType?: string) => {
    try {
      let url = `/api/lectures/${lectureId}/reflections`;

      // Add query params if provided
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (promptType) params.append('promptType', promptType);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reflections');
      }

      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching reflections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      };
    }
  },

  /**
   * Get a display label for a prompt type
   * @param promptType - The prompt type
   * @returns The display label
   */
  getPromptLabel: (promptType: string): string => {
    switch (promptType) {
      case 'pre-lecture':
        return 'Pre-Lecture Reflection';
      case 'initial':
        return 'Initial Reflection';
      case 'mastery':
        return 'Mastery Reflection';
      case 'discussion':
        return 'Discussion';
      default:
        return promptType.charAt(0).toUpperCase() + promptType.slice(1);
    }
  },

  /**
   * Format reflection content for display, truncating if needed
   * @param content - The reflection content
   * @param maxLength - Maximum length before truncation
   * @returns Formatted content
   */
  formatReflectionForDisplay: (content: string, maxLength = 100): string => {
    if (!content) return '';

    // Truncate if longer than maxLength
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }

    return content;
  }
};

// Allow for default import
export default reflectionService;
