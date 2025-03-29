// src/lib/services/reflectionService.ts

/**
 * Represents a reflection submission
 */
export interface ReflectionSubmission {
  lectureId: string;
  promptType: string;
  content: string;
}

/**
 * Represents AI evaluation data structure
 */
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
 * Represents a reflection with evaluation data
 */
export interface Reflection {
  id: string;
  userId: string;
  lectureId: string;
  promptType: string;
  content: string;
  status: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
  parsedEvaluation?: AIEvaluationData | null;
}

/**
 * API response with pagination information
 */
interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Filter options for retrieving reflections
 */
export interface ReflectionFilterOptions {
  promptType?: string;
  status?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Service for managing reflections
 */
export const reflectionService = {
  /**
   * Submit a new reflection
   */
  async submitReflection(data: ReflectionSubmission): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reflection');
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error submitting reflection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get reflections for a specific lecture and user
   */
  async getLectureReflections(
    lectureId: string,
    userId?: string,
    promptType?: string
  ): Promise<{
    success: boolean;
    data?: Reflection[];
    error?: string;
  }> {
    try {
      let url = `/api/lectures/${lectureId}/reflections`;

      // Add query parameters if provided
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (promptType) params.append('promptType', promptType);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reflections: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data, // API returns { data: reflectionsData }
      };
    } catch (error) {
      console.error('Error fetching reflections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get all reflections for a user with filtering options
   */
  async getUserReflections(
    userId: string,
    options: ReflectionFilterOptions = {}
  ): Promise<{
    success: boolean;
    data?: PaginatedResponse<Reflection>;
    error?: string;
  }> {
    try {
      const {
        promptType,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = options;

      // Build query parameters
      const params = new URLSearchParams();
      if (promptType) params.append('promptType', promptType);
      if (status) params.append('status', status);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/api/users/${userId}/reflections?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch user reflections: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error fetching user reflections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get a specific reflection by ID
   */
  async getReflectionById(reflectionId: string): Promise<{
    success: boolean;
    data?: Reflection;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/reflections/${reflectionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reflection: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error fetching reflection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Update a reflection with AI evaluation results
   */
  async submitAIEvaluation(
    reflectionId: string,
    evaluationData: AIEvaluationData
  ): Promise<{
    success: boolean;
    data?: Reflection;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/reflections/${reflectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiEvaluation: evaluationData,
          status: 'EVALUATED',
          score: evaluationData.score,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to submit evaluation: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Update a reflection's content
   */
  async updateReflectionContent(
    reflectionId: string,
    content: string
  ): Promise<{
    success: boolean;
    data?: Reflection;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/reflections/${reflectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update reflection: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error updating reflection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get reflection statistics for a user
   */
  async getUserReflectionStats(userId: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      byPromptType: Record<string, number>;
      byStatus: Record<string, number>;
      averageScore?: number;
      masteryRate?: number;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/users/${userId}/reflections/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reflection stats: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error fetching reflection stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get reflection statistics for a lecture
   */
  async getLectureReflectionStats(lectureId: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      byPromptType: Record<string, number>;
      byStatus: Record<string, number>;
      averageScore?: number;
      masteryRate?: number;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/reflections/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch lecture reflection stats: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      console.error('Error fetching lecture reflection stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Export reflections to Markdown
   * Opens a new tab with the exported Markdown
   */
  async exportReflectionsToMarkdown(
    options: {
      userId?: string;
      lectureId?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { userId, lectureId } = options;

      // Build query parameters
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (lectureId) params.append('lectureId', lectureId);

      // Open the export endpoint in a new tab to download the file
      window.open(`/api/reflections/export?${params.toString()}`, '_blank');

      return { success: true };
    } catch (error) {
      console.error('Error exporting reflections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  },

  /**
   * Get a word count for text
   */
  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  /**
   * Check if a reflection meets minimum word count
   */
  meetsMinimumWordCount(text: string, minimumWords: number): boolean {
    return this.getWordCount(text) >= minimumWords;
  },

  /**
   * Get appropriate prompt label from prompt type
   */
  getPromptLabel(promptType: string): string {
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
        return 'Reflection';
    }
  },

  /**
   * Format reflection for display (truncate if needed)
   */
  formatReflectionForDisplay(content: string, maxLength = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
};

export default reflectionService;
