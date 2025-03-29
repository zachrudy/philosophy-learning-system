// src/lib/utils/workflowUtils.ts
import { PROGRESS_STATUS } from '@/lib/constants';

/**
 * Workflow stage definition
 */
export interface WorkflowStage {
  key: string;
  label: string;
  description: string;
  order: number;
  requiredForCompletion: boolean;
}

/**
 * Definition of all workflow stages in the lecture learning path
 */
export const WORKFLOW_STAGES: Record<string, WorkflowStage> = {
  [PROGRESS_STATUS.LOCKED]: {
    key: PROGRESS_STATUS.LOCKED,
    label: 'Locked',
    description: 'Complete prerequisites to unlock this lecture',
    order: 0,
    requiredForCompletion: false
  },
  [PROGRESS_STATUS.READY]: {
    key: PROGRESS_STATUS.READY,
    label: 'Pre-Lecture',
    description: 'Activate prior knowledge before watching',
    order: 1,
    requiredForCompletion: true
  },
  [PROGRESS_STATUS.STARTED]: {
    key: PROGRESS_STATUS.STARTED,
    label: 'View Lecture',
    description: 'Watch or read the lecture content',
    order: 2,
    requiredForCompletion: true
  },
  [PROGRESS_STATUS.WATCHED]: {
    key: PROGRESS_STATUS.WATCHED,
    label: 'Initial Reflection',
    description: 'Reflect on key ideas from the lecture',
    order: 3,
    requiredForCompletion: true
  },
  [PROGRESS_STATUS.INITIAL_REFLECTION]: {
    key: PROGRESS_STATUS.INITIAL_REFLECTION,
    label: 'Mastery Reflection',
    description: 'Demonstrate deeper understanding',
    order: 4,
    requiredForCompletion: true
  },
  [PROGRESS_STATUS.MASTERY_TESTING]: {
    key: PROGRESS_STATUS.MASTERY_TESTING,
    label: 'Evaluation',
    description: 'Receive feedback on your understanding',
    order: 5,
    requiredForCompletion: true
  },
  [PROGRESS_STATUS.MASTERED]: {
    key: PROGRESS_STATUS.MASTERED,
    label: 'Completed',
    description: 'Lecture mastered',
    order: 6,
    requiredForCompletion: true
  }
};

/**
 * Maps progress status to prompt type
 */
export const STATUS_TO_PROMPT_TYPE: Record<string, string> = {
  [PROGRESS_STATUS.READY]: 'pre-lecture',
  [PROGRESS_STATUS.WATCHED]: 'initial',
  [PROGRESS_STATUS.INITIAL_REFLECTION]: 'mastery',
  [PROGRESS_STATUS.MASTERED]: 'discussion'
};

/**
 * Maps prompt type to progress status
 */
export const PROMPT_TYPE_TO_NEXT_STATUS: Record<string, string> = {
  'pre-lecture': PROGRESS_STATUS.STARTED,
  'initial': PROGRESS_STATUS.INITIAL_REFLECTION,
  'mastery': PROGRESS_STATUS.MASTERY_TESTING,
  'discussion': PROGRESS_STATUS.MASTERED
};

/**
 * Workflow transitions mapping
 * Defines valid next states for each current state
 */
export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  [PROGRESS_STATUS.LOCKED]: [PROGRESS_STATUS.READY],
  [PROGRESS_STATUS.READY]: [PROGRESS_STATUS.STARTED],
  [PROGRESS_STATUS.STARTED]: [PROGRESS_STATUS.WATCHED],
  [PROGRESS_STATUS.WATCHED]: [PROGRESS_STATUS.INITIAL_REFLECTION],
  [PROGRESS_STATUS.INITIAL_REFLECTION]: [PROGRESS_STATUS.MASTERY_TESTING],
  [PROGRESS_STATUS.MASTERY_TESTING]: [PROGRESS_STATUS.MASTERED, PROGRESS_STATUS.INITIAL_REFLECTION],
  [PROGRESS_STATUS.MASTERED]: []
};

/**
 * Get the workflow stage for a given status
 */
export function getWorkflowStage(status: string): WorkflowStage {
  return WORKFLOW_STAGES[status] || WORKFLOW_STAGES[PROGRESS_STATUS.LOCKED];
}

/**
 * Get the prompt type for a given status
 */
export function getPromptTypeForStatus(status: string): string | null {
  return STATUS_TO_PROMPT_TYPE[status] || null;
}

/**
 * Get the next status after completing a reflection of the given prompt type
 */
export function getNextStatusForPromptType(promptType: string): string | null {
  return PROMPT_TYPE_TO_NEXT_STATUS[promptType] || null;
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  const validTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(nextStatus);
}

/**
 * Get the next allowed statuses for the current status
 */
export function getNextPossibleStatuses(currentStatus: string): string[] {
  return WORKFLOW_TRANSITIONS[currentStatus] || [];
}

/**
 * Get all workflow stages in order
 */
export function getAllWorkflowStages(): WorkflowStage[] {
  return Object.values(WORKFLOW_STAGES).sort((a, b) => a.order - b.order);
}

/**
 * Calculate completion percentage based on current status
 */
export function calculateCompletionPercentage(currentStatus: string): number {
  const currentStage = getWorkflowStage(currentStatus);
  const requiredStages = Object.values(WORKFLOW_STAGES).filter(stage => stage.requiredForCompletion);
  const completedStages = requiredStages.filter(stage => stage.order <= currentStage.order);

  if (requiredStages.length === 0) return 0;

  return Math.round((completedStages.length / requiredStages.length) * 100);
}

/**
 * Get minimum word count requirement for a given prompt type
 */
export function getMinimumWordCountForPromptType(promptType: string): number {
  switch (promptType) {
    case 'pre-lecture':
      return 30;
    case 'initial':
      return 30;
    case 'mastery':
      return 50;
    case 'discussion':
      return 0; // Optional, no minimum
    default:
      return 30;
  }
}

/**
 * Get the mastery threshold score
 */
export function getMasteryThreshold(): number {
  return 70; // Score of 70 or higher is required for mastery
}

/**
 * Check if a status is considered "in progress"
 */
export function isInProgress(status: string): boolean {
  return [
    PROGRESS_STATUS.STARTED,
    PROGRESS_STATUS.WATCHED,
    PROGRESS_STATUS.INITIAL_REFLECTION,
    PROGRESS_STATUS.MASTERY_TESTING,
  ].includes(status);
}

/**
 * Check if a status is considered "completed" (mastered)
 */
export function isCompleted(status: string): boolean {
  return status === PROGRESS_STATUS.MASTERED;
}

/**
 * Check if a status is considered "available" to start
 */
export function isAvailable(status: string): boolean {
  return status === PROGRESS_STATUS.READY;
}

/**
 * Check if a status is considered "locked"
 */
export function isLocked(status: string): boolean {
  return status === PROGRESS_STATUS.LOCKED;
}

/**
 * Get the action text for a given status
 */
export function getActionText(status: string): string {
  switch (status) {
    case PROGRESS_STATUS.LOCKED:
      return 'View Prerequisites';
    case PROGRESS_STATUS.READY:
      return 'Start Learning';
    case PROGRESS_STATUS.STARTED:
      return 'Watch Lecture';
    case PROGRESS_STATUS.WATCHED:
      return 'Write Initial Reflection';
    case PROGRESS_STATUS.INITIAL_REFLECTION:
      return 'Write Mastery Reflection';
    case PROGRESS_STATUS.MASTERY_TESTING:
      return 'Submit Evaluation';
    case PROGRESS_STATUS.MASTERED:
      return 'Review Lecture';
    default:
      return 'Continue';
  }
}

/**
 * Get the icon for a given status
 */
export function getStatusIcon(status: string): string {
  switch (status) {
    case PROGRESS_STATUS.LOCKED:
      return '🔒';
    case PROGRESS_STATUS.READY:
      return '✓';
    case PROGRESS_STATUS.STARTED:
      return '▶';
    case PROGRESS_STATUS.WATCHED:
      return '👁️';
    case PROGRESS_STATUS.INITIAL_REFLECTION:
      return '✏️';
    case PROGRESS_STATUS.MASTERY_TESTING:
      return '🧠';
    case PROGRESS_STATUS.MASTERED:
      return '🏆';
    default:
      return '❓';
  }
}
