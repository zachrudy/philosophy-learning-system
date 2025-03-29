// src/lib/services/studentService.ts
import { PROGRESS_STATUS } from '@/lib/constants';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  contentUrl: string;
  order: number;
}

interface LectureAvailability {
  lecture: Lecture;
  isCompleted: boolean;
  isInProgress: boolean;
  isAvailable: boolean;
  status: string;
  readinessScore: number;
  prerequisitesSatisfied: boolean;
  prerequisitesCount?: {
    required: number;
    recommended: number;
    completedRequired: number;
    completedRecommendedCount: number;
  };
}

interface LectureSuggestion {
  lecture: Lecture;
  status: string;
  readinessScore: number;
}

interface ReflectionSubmission {
  lectureId: string;
  promptType: string;
  content: string;
}

interface ProgressUpdate {
  lectureId: string;
  status: string;
  score?: number;
}

/**
 * Service for handling student-related API calls
 */
export const StudentService = {
  /**
   * Get available lectures for the current student
   */
  async getAvailableLectures(options: {
    category?: string;
    includeInProgress?: boolean;
  } = {}) {
    try {
      const { category, includeInProgress = true } = options;

      let url = '/api/student/available-lectures';
      const params = new URLSearchParams();

      if (category) params.append('category', category);
      if (includeInProgress !== undefined) params.append('includeInProgress', String(includeInProgress));

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch available lectures');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available lectures:', error);
      throw error;
    }
  },

  /**
   * Get suggested next lectures for the student
   */
  async getSuggestedLectures(options: {
    limit?: number;
    category?: string;
  } = {}) {
    try {
      const { limit = 5, category } = options;

      let url = '/api/student/suggested-lectures';
      const params = new URLSearchParams();

      if (limit) params.append('limit', String(limit));
      if (category) params.append('category', category);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch suggested lectures');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching suggested lectures:', error);
      throw error;
    }
  },

  /**
   * Get lecture details with current progress
   */
  async getLectureWithProgress(lectureId: string) {
    try {
      const response = await fetch(`/api/lectures/${lectureId}?includeProgress=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch lecture details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching lecture with progress:', error);
      throw error;
    }
  },

  /**
   * Submit a reflection for a lecture
   */
  async submitReflection(data: ReflectionSubmission) {
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

      return await response.json();
    } catch (error) {
      console.error('Error submitting reflection:', error);
      throw error;
    }
  },

  /**
   * Update lecture progress status
   */
  async updateProgress(data: ProgressUpdate) {
    try {
      const response = await fetch('/api/progress', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  /**
   * Mark a lecture as viewed
   */
  async markLectureViewed(lectureId: string) {
    try {
      const response = await fetch(`/api/student/lectures/${lectureId}/viewed`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark lecture as viewed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking lecture as viewed:', error);
      throw error;
    }
  },

  /**
   * Start a lecture (initialize progress)
   */
  async startLecture(lectureId: string) {
    try {
      const response = await fetch(`/api/student/lectures/${lectureId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start lecture');
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting lecture:', error);
      throw error;
    }
  },

  /**
   * Submit mastery score for a lecture
   */
  async submitMasteryScore(lectureId: string, score: number) {
    try {
      const response = await fetch(`/api/student/lectures/${lectureId}/mastery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit mastery score');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting mastery score:', error);
      throw error;
    }
  },
};

export default StudentService;
