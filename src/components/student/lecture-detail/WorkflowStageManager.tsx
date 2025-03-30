// src/components/student/lecture-detail/WorkflowStageManager.tsx

'use client';

import React, { useState } from 'react';
import WorkflowIndicator from './WorkflowIndicator';
import PrerequisiteCheck from './PrerequisiteCheck';
import LectureContent from './LectureContent';
import ReflectionForm from '../reflection/ReflectionForm';
import ReflectionPrompt from '../reflection/ReflectionPrompt';
import WorkflowActions from '../workflow/WorkflowActions';
import { updateProgressStatus } from '@/lib/services/progressService';
import { reflectionService } from '@/lib/services/reflectionService';

interface WorkflowStageManagerProps {
  lecture: any;
  progress: any;
  prerequisiteStatus: any;
  userId: string;
  onProgressUpdate: (updatedProgress: any) => void;
}

export default function WorkflowStageManager({
  lecture,
  progress,
  prerequisiteStatus,
  userId,
  onProgressUpdate
}: WorkflowStageManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle workflow stage transitions
  const handleStageTransition = async (newStatus: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await updateProgressStatus(userId, lecture.id, newStatus);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress');
      }

      // Update the progress in the parent component
      onProgressUpdate(result.data);
    } catch (err) {
      console.error('Error transitioning workflow stage:', err);
      setError('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reflection submission
  const handleReflectionSubmit = async (promptType: string, content: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit the reflection
      const reflectionResult = await reflectionService.submitReflection(lecture.id, promptType, content);

      if (!reflectionResult.success) {
        throw new Error(reflectionResult.error || 'Failed to submit reflection');
      }

      // Determine the next status based on the prompt type
      let nextStatus;
      switch (promptType) {
        case 'pre-lecture':
          nextStatus = 'STARTED';
          break;
        case 'initial':
          nextStatus = 'INITIAL_REFLECTION';
          break;
        case 'mastery':
          nextStatus = 'MASTERY_TESTING';
          break;
        default:
          nextStatus = progress.status;
      }

      // Update the progress status
      const progressResult = await updateProgressStatus(userId, lecture.id, nextStatus);

      if (!progressResult.success) {
        throw new Error(progressResult.error || 'Failed to update progress');
      }

      // Update the progress in the parent component
      onProgressUpdate(progressResult.data);
    } catch (err) {
      console.error('Error submitting reflection:', err);
      setError('Failed to submit reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI evaluation submission (for MVP, manual input)
  const handleAIEvaluationSubmit = async (score: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // For MVP, we'll just update the progress status based on the score
      const nextStatus = score >= 70 ? 'MASTERED' : 'INITIAL_REFLECTION';

      const result = await updateProgressStatus(userId, lecture.id, nextStatus);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress');
      }

      // Update the progress in the parent component
      onProgressUpdate(result.data);
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine what to render based on progress status
  const renderWorkflowStage = () => {
    // Check if prerequisites are satisfied
    if (!prerequisiteStatus.satisfied) {
      return (
        <PrerequisiteCheck
          prerequisites={prerequisiteStatus}
          lecture={lecture}
        />
      );
    }

    // Render based on current progress status
    switch (progress.status) {
      case 'LOCKED':
        return (
          <PrerequisiteCheck
            prerequisites={prerequisiteStatus}
            lecture={lecture}
          />
        );

      case 'READY':
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pre-Lecture Reflection</h2>
            <ReflectionPrompt
              promptText={lecture.preLecturePrompt}
              promptType="pre-lecture"
            />
            <ReflectionForm
              onSubmit={(content) => handleReflectionSubmit('pre-lecture', content)}
              minWords={30}
              isSubmitting={isSubmitting}
            />
          </div>
        );

      case 'STARTED':
        return (
          <div className="p-6">
            <LectureContent
              lecture={lecture}
              onComplete={() => handleStageTransition('WATCHED')}
            />
          </div>
        );

      case 'WATCHED':
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Initial Reflection</h2>
            <ReflectionPrompt
              promptText={lecture.initialPrompt}
              promptType="initial"
            />
            <ReflectionForm
              onSubmit={(content) => handleReflectionSubmit('initial', content)}
              minWords={30}
              isSubmitting={isSubmitting}
            />
          </div>
        );

      case 'INITIAL_REFLECTION':
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Mastery Reflection</h2>
            <ReflectionPrompt
              promptText={lecture.masteryPrompt}
              promptType="mastery"
            />
            <ReflectionForm
              onSubmit={(content) => handleReflectionSubmit('mastery', content)}
              minWords={50}
              isSubmitting={isSubmitting}
            />
          </div>
        );

      case 'MASTERY_TESTING':
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI Evaluation</h2>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-700">{lecture.evaluationPrompt}</p>
            </div>
            <div className="mt-4">
              <label htmlFor="evaluation-score" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Evaluation Score (0-100)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  id="evaluation-score"
                  min="0"
                  max="100"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Score"
                />
                <button
                  onClick={() => {
                    const scoreInput = document.getElementById('evaluation-score') as HTMLInputElement;
                    const score = parseInt(scoreInput.value);
                    if (score >= 0 && score <= 100) {
                      handleAIEvaluationSubmit(score);
                    }
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Score'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Score of 70 or higher will mark this lecture as mastered.
              </p>
            </div>
          </div>
        );

      case 'MASTERED':
        return (
          <div className="p-6">
            <div className="bg-green-50 p-4 rounded-md mb-6">
              <h2 className="text-lg font-medium text-green-800">🎉 Lecture Mastered</h2>
              <p className="mt-1 text-sm text-green-700">
                You have successfully demonstrated mastery of this lecture.
              </p>
            </div>
            <LectureContent
              lecture={lecture}
              readOnly={true}
            />
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900">Discussion Prompts</h3>
              <div className="mt-2 bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700">{lecture.discussionPrompts}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-700">
                Unknown progress status: {progress.status}. Please contact support.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <WorkflowIndicator currentStatus={progress.status} />

      {error && (
        <div className="mx-6 mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {renderWorkflowStage()}

      <WorkflowActions
        status={progress.status}
        isSubmitting={isSubmitting}
        onAction={handleStageTransition}
      />
    </div>
  );
}
