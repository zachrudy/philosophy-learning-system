// src/components/student/lecture-detail/PreLectureStage.tsx

'use client';

import React, { useState } from 'react';
import ReflectionPrompt from '../reflection/ReflectionPrompt';
import ReflectionForm from '../reflection/ReflectionForm';
import { reflectionService } from '@/lib/services/reflectionService';
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

      console.log("Submitting pre-lecture reflection...");
      console.log("Lecture ID:", lecture.id);
      console.log("User ID:", userId);

      // Submit the reflection using the updated service method
      const reflectionResult = await reflectionService.submitReflection(
        lecture.id,
        'pre-lecture',
        content
      );

      console.log("Reflection submission result:", reflectionResult);

      if (!reflectionResult.success) {
        throw new Error(reflectionResult.error || 'Failed to submit reflection');
      }

      // Update the progress status to STARTED
      console.log("Updating progress status to STARTED...");
      const progressResult = await updateProgressStatus(userId, lecture.id, PROGRESS_STATUS.STARTED);

      console.log("Progress update result:", progressResult);

      if (!progressResult.success) {
        throw new Error(progressResult.error || 'Failed to update progress');
      }

      // Update UI state
      console.log("Setting hasSubmitted to true");
      setHasSubmitted(true);

      // Wait a moment before notifying parent component of the status change
      setTimeout(() => {
        console.log("Calling onProgressUpdate with STARTED status");
        onProgressUpdate(PROGRESS_STATUS.STARTED);
      }, 500);
    } catch (err) {
      console.error('Error submitting pre-lecture reflection:', err);
      setError('Failed to submit reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add debug rendering to check if hasSubmitted is true
  console.log("Current state - hasSubmitted:", hasSubmitted);

  if (hasSubmitted) {
    console.log("Rendering success message");
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
          onClick={() => {
            console.log("Continue button clicked");
            onProgressUpdate(PROGRESS_STATUS.STARTED);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Continue to Lecture
        </button>
      </div>
    );
  }

  console.log("Rendering form");
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
        onSubmitSuccess={(content) => {
          console.log("ReflectionForm onSubmitSuccess called");
          handleReflectionSubmit(content);
        }}
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
