// src/components/student/workflow/WorkflowActions.tsx
import React, { useState } from 'react';
import { updateProgressStatus } from '@/lib/services/progressService';
import { PROGRESS_STATUS } from '@/lib/constants';

interface WorkflowActionsProps {
  lectureId: string;
  currentStatus: string;
  prerequisitesSatisfied: boolean;
  onStatusUpdate?: (newStatus: string) => void;
  isSubmittingReflection?: boolean;
  className?: string;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  lectureId,
  currentStatus,
  prerequisitesSatisfied,
  onStatusUpdate,
  isSubmittingReflection = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to update progress status
  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await updateProgressStatus(userId, lectureId, newStatus);
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update your progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button text and action based on current status
  let buttonText = '';
  let statusToUpdate = '';
  let isDisabled = isLoading || isSubmittingReflection;
  let tooltipText = '';

  switch (currentStatus) {
    case PROGRESS_STATUS.LOCKED:
      buttonText = 'Start Learning';
      statusToUpdate = PROGRESS_STATUS.READY;
      isDisabled = isDisabled || !prerequisitesSatisfied;
      tooltipText = !prerequisitesSatisfied ? 'Complete prerequisites first' : '';
      break;

    case PROGRESS_STATUS.READY:
      buttonText = 'Begin Lecture';
      statusToUpdate = PROGRESS_STATUS.STARTED;
      break;

    case PROGRESS_STATUS.STARTED:
      buttonText = 'Mark as Viewed';
      statusToUpdate = PROGRESS_STATUS.WATCHED;
      break;

    case PROGRESS_STATUS.WATCHED:
      buttonText = 'Continue to Initial Reflection';
      statusToUpdate = PROGRESS_STATUS.INITIAL_REFLECTION;
      break;

    case PROGRESS_STATUS.INITIAL_REFLECTION:
      buttonText = 'Continue to Mastery Test';
      statusToUpdate = PROGRESS_STATUS.MASTERY_TESTING;
      break;

    case PROGRESS_STATUS.MASTERY_TESTING:
      // No button here as this typically requires AI evaluation
      buttonText = 'Awaiting Evaluation';
      isDisabled = true;
      break;

    case PROGRESS_STATUS.MASTERED:
      buttonText = 'Completed';
      isDisabled = true;
      break;

    default:
      buttonText = 'Continue';
      isDisabled = true;
  }

  return (
    <div className={className}>
      <div className="flex justify-center">
        <button
          onClick={() => updateStatus(statusToUpdate)}
          disabled={isDisabled}
          className={`px-4 py-2 rounded-md font-medium ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          title={tooltipText}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 text-sm text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default WorkflowActions;
