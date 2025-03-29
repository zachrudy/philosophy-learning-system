// src/components/student/lecture-detail/PreLectureStage.tsx

'use client';

import React, { useState } from 'react';
import ReflectionPrompt from '../reflection/ReflectionPrompt';
import ReflectionForm from '../reflection/ReflectionForm';
import { submitReflection } from '@/lib/services/reflectionService';
import { updateProgressStatus } from '@/lib/services/progressService';
import { PROGRESS_STATUS } from '@/lib/constants';

interface PreLectureStageProps {
  lecture: {
    id: string;
    title: string;
    preLecturePrompt: string;
  };
  userId: string;
  onProgressUpdate: (newStatus: string) => void;
}

const PreLectureStage: React.FC<PreLectureStageProps> = ({
  lecture,
  userId,
  onProgressUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleReflectionSubmit = async (content: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit the reflection
      const reflectionResult = await submitReflection(lecture.id, 'pre-lecture', content);

      if (!reflectionResult.success) {
        throw new Error(reflectionResult.error || 'Failed to submit reflection');
      }

      // Update the progress status to STARTED
      const progressResult = await updateProgressStatus(userId, lecture.id, PROGRESS_STATUS.STARTED);

      if (!progressResult.success) {
        throw new Error(progressResult.error || 'Failed to update progress');
      }

      // Update UI state
      setHasSubmitted(true);

      // Notify parent component of the status change
      onProgressUpdate(PROGRESS_STATUS.STARTED);
    } catch (err) {
      console.error('Error submitting pre-lecture reflection:', err);
      setError('Failed to submit reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-green-50 rounded-lg p-6 text-center my-6">
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-green-800 mb-2">Pre-Lecture Reflection Submitted</h3>
        <p className="text-green-600 mb-4">Your reflection has been submitted successfully.</p>
        <button
          onClick={() => onProgressUpdate(PROGRESS_STATUS.STARTED)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Continue to Lecture
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Pre-Lecture Reflection</h2>
      <p className="text-gray-600 mb-6">
        Before watching the lecture, please respond to the prompt below. This will help activate your prior knowledge and prepare your mind for the new concepts.
      </p>

      <ReflectionPrompt
        lecture={lecture}
        promptType="pre-lecture"
        className="mb-6"
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <ReflectionForm
        lectureId={lecture.id}
        promptType="pre-lecture"
        minimumWords={30}
        onSubmitSuccess={() => handleReflectionSubmit}
        className="mt-4"
      />

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> You must submit a reflection of at least 30 words to proceed to the lecture content.
        </p>
      </div>
    </div>
  );
};

export default PreLectureStage;
