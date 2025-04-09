// src/components/student/lecture-detail/MasteryTestingStage.tsx

'use client';

import React, { useState } from 'react';
import ReflectionPrompt from '../reflection/ReflectionPrompt';
import ReflectionForm from '../reflection/ReflectionForm';
import { reflectionService } from '@/lib/services/reflectionService';
import { updateProgressStatus } from '@/lib/services/progressService';
import { PROGRESS_STATUS } from '@/lib/constants';

interface MasteryTestingStageProps {
  lecture: {
    id: string;
    title: string;
    masteryPrompt: string;
    evaluationPrompt: string;
  };
  userId: string;
  onProgressUpdate: (newStatus: string) => void;
}

const MasteryTestingStage: React.FC<MasteryTestingStageProps> = ({
  lecture,
  userId,
  onProgressUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Handle the mastery reflection submission
  const handleReflectionSubmit = async (content: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit the reflection
      const reflectionResult = await reflectionService.submitReflection(
        lecture.id,
        'mastery',
        content
      );

      if (!reflectionResult.success) {
        throw new Error(reflectionResult.error || 'Failed to submit reflection');
      }

      // Update the progress status to MASTERY_TESTING
      const progressResult = await updateProgressStatus(userId, lecture.id, PROGRESS_STATUS.MASTERY_TESTING);

      if (!progressResult.success) {
        throw new Error(progressResult.error || 'Failed to update progress');
      }

      // Update UI state
      setReflectionSubmitted(true);

      // Notify parent component of the status change
      onProgressUpdate(PROGRESS_STATUS.MASTERY_TESTING);
    } catch (err) {
      console.error('Error submitting mastery reflection:', err);
      setError('Failed to submit reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle evaluation score submission
  const handleScoreSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (score === null) {
        setError('Please enter a valid score');
        return;
      }

      // Determine the next status based on the score
      const nextStatus = score >= 70 ? PROGRESS_STATUS.MASTERED : PROGRESS_STATUS.INITIAL_REFLECTION;

      // Update the progress status
      const progressResult = await updateProgressStatus(userId, lecture.id, nextStatus);

      if (!progressResult.success) {
        throw new Error(progressResult.error || 'Failed to update progress');
      }

      // Notify parent component of the status change
      onProgressUpdate(nextStatus);
    } catch (err) {
      console.error('Error submitting evaluation score:', err);
      setError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the reflection hasn't been submitted yet, show the reflection form
  if (!reflectionSubmitted) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Mastery Reflection</h2>
        <p className="text-gray-600 mb-6">
          This is the final step in demonstrating your understanding of the lecture.
          Please respond to the prompt below with a thoughtful reflection that shows
          your grasp of the key concepts.
        </p>

        <ReflectionPrompt
          lecture={lecture}
          promptType="mastery"
          className="mb-6"
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <ReflectionForm
          lectureId={lecture.id}
          promptType="mastery"
          minimumWords={50}
          onSubmitSuccess={(content) => handleReflectionSubmit(content)}
          className="mt-4"
        />

        <div className="mt-6 text-sm text-gray-500">
          <p>
            <strong>Note:</strong> After submitting your mastery reflection, you'll receive
            an evaluation score. A score of 70 or above will mark this lecture as mastered.
          </p>
        </div>
      </div>
    );
  }

  // After reflection submission, show the evaluation form
  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">AI Evaluation</h2>

      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <h3 className="text-md font-medium text-blue-800 mb-2">Evaluation Prompt</h3>
        <p className="text-sm text-blue-700">{lecture.evaluationPrompt}</p>
      </div>

      <div className="bg-green-50 p-4 rounded-md mb-6">
        <p className="text-sm text-green-700">
          <strong>Instruction:</strong> Copy your mastery reflection and the above evaluation prompt
          into Claude. Evaluate your reflection using Claude according to the criteria in the prompt.
          Then enter the score (out of 100) that Claude gives you.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="evaluation-score" className="block text-sm font-medium text-gray-700 mb-1">
          Enter Evaluation Score (0-100)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            id="evaluation-score"
            min="0"
            max="100"
            value={score !== null ? score : ''}
            onChange={(e) => setScore(e.target.value ? Number(e.target.value) : null)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md p-2"
            placeholder="Score"
          />
          <button
            onClick={handleScoreSubmit}
            disabled={isSubmitting || score === null}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isSubmitting || score === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Score'
            )}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-yellow-800 mb-2">Mastery Requirements</h3>
        <p className="text-sm text-yellow-700">
          To achieve mastery of this lecture, you need a score of 70 or higher. If your score is below 70,
          you'll be returned to the initial reflection stage to review the content and try again.
        </p>
      </div>
    </div>
  );
};

export default MasteryTestingStage;
