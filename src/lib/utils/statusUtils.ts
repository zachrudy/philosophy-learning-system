// src/lib/utils/statusUtils.ts
import { PROGRESS_STATUS } from '@/lib/constants';

/**
 * Utility functions for working with lecture status
 */
export const StatusUtils = {
  /**
   * Get the display name for a status
   */
  getStatusDisplayName(status: string): string {
    switch (status) {
      case PROGRESS_STATUS.LOCKED:
        return 'Locked';
      case PROGRESS_STATUS.READY:
        return 'Ready to Start';
      case PROGRESS_STATUS.STARTED:
        return 'Started';
      case PROGRESS_STATUS.WATCHED:
        return 'Watched';
      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return 'Initial Reflection';
      case PROGRESS_STATUS.MASTERY_TESTING:
        return 'Mastery Testing';
      case PROGRESS_STATUS.MASTERED:
        return 'Mastered';
      // Additional statuses for student display
      case 'AVAILABLE':
        return 'Available';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  },

  /**
   * Get the color class for a status (Tailwind)
   */
  getStatusColor(status: string): { bg: string; text: string; border?: string } {
    switch (status) {
      case PROGRESS_STATUS.LOCKED:
        return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
      case PROGRESS_STATUS.READY:
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case PROGRESS_STATUS.STARTED:
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      case PROGRESS_STATUS.WATCHED:
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' };
      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' };
      case PROGRESS_STATUS.MASTERY_TESTING:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      case PROGRESS_STATUS.MASTERED:
        return { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300' };
      // Additional statuses for student display
      case 'AVAILABLE':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'IN_PROGRESS':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      case 'COMPLETED':
        return { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  },

  /**
   * Get the action text for a given status
   */
  getActionText(status: string): string {
    switch (status) {
      case PROGRESS_STATUS.LOCKED:
        return 'View Prerequisites';
      case PROGRESS_STATUS.READY:
        return 'Start Learning';
      case PROGRESS_STATUS.STARTED:
        return 'Watch Lecture';
      case PROGRESS_STATUS.WATCHED:
        return 'Submit Initial Reflection';
      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return 'Submit Mastery Reflection';
      case PROGRESS_STATUS.MASTERY_TESTING:
        return 'Submit Score';
      case PROGRESS_STATUS.MASTERED:
        return 'Review Lecture';
      // Additional statuses for student display
      case 'AVAILABLE':
        return 'Start Learning';
      case 'IN_PROGRESS':
        return 'Continue Learning';
      case 'COMPLETED':
        return 'Review Lecture';
      default:
        return 'View Lecture';
    }
  },

  /**
   * Determine if a status is considered "in progress"
   */
  isInProgress(status: string): boolean {
    return [
      PROGRESS_STATUS.STARTED,
      PROGRESS_STATUS.WATCHED,
      PROGRESS_STATUS.INITIAL_REFLECTION,
      PROGRESS_STATUS.MASTERY_TESTING,
      'IN_PROGRESS',
    ].includes(status);
  },

  /**
   * Determine if a status is considered "completed"
   */
  isCompleted(status: string): boolean {
    return [
      PROGRESS_STATUS.MASTERED,
      'COMPLETED',
    ].includes(status);
  },

  /**
   * Determine if a status is considered "available"
   */
  isAvailable(status: string): boolean {
    return [
      PROGRESS_STATUS.READY,
      'AVAILABLE',
    ].includes(status);
  },

  /**
   * Get the step description for the workflow stage
   */
  getStepDescription(status: string): string {
    switch (status) {
      case PROGRESS_STATUS.LOCKED:
        return 'Complete prerequisite lectures to unlock this content.';
      case PROGRESS_STATUS.READY:
        return 'Start by completing the pre-lecture reflection to prepare for learning.';
      case PROGRESS_STATUS.STARTED:
        return 'Watch the lecture video to continue your learning journey.';
      case PROGRESS_STATUS.WATCHED:
        return 'Submit your initial reflection on what you learned from the lecture.';
      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return 'Complete the mastery reflection to demonstrate your understanding.';
      case PROGRESS_STATUS.MASTERY_TESTING:
        return 'Submit your AI evaluation score to complete this lecture.';
      case PROGRESS_STATUS.MASTERED:
        return 'You have mastered this lecture! You can review it anytime.';
      default:
        return 'Follow the steps to complete this lecture.';
    }
  },

  /**
   * Convert API status to simplified student-facing status
   */
  simplifyStatus(status: string): string {
    if (this.isCompleted(status)) {
      return 'COMPLETED';
    }

    if (this.isInProgress(status)) {
      return 'IN_PROGRESS';
    }

    if (this.isAvailable(status)) {
      return 'AVAILABLE';
    }

    return 'LOCKED';
  }
};

export default StatusUtils;
