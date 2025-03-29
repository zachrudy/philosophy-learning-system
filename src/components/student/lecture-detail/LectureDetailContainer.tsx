'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkflowStageManager from './WorkflowStageManager';
import LectureHeader from './LectureHeader';
import { fetchLectureDetails, checkPrerequisitesSatisfied } from '@/lib/services/lectureService';
import { getUserProgressForLecture } from '@/lib/services/progressService';

interface LectureDetailContainerProps {
  lectureId: string;
  userId: string;
}

export default function LectureDetailContainer({ lectureId, userId }: LectureDetailContainerProps) {
  const router = useRouter();
  const [lecture, setLecture] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [prerequisiteStatus, setPrerequisiteStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLectureData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch lecture details with prerequisites and entities
        const lectureResponse = await fetchLectureDetails(lectureId);

        if (!lectureResponse.data) {
          throw new Error('Failed to load lecture details');
        }

        setLecture(lectureResponse.data);

        // Fetch user's progress for this lecture
        const progressResponse = await getUserProgressForLecture(userId, lectureId);
        setProgress(progressResponse.data);

        // Check if prerequisites are satisfied
        const prerequisiteResponse = await checkPrerequisitesSatisfied(userId, lectureId);
        setPrerequisiteStatus(prerequisiteResponse.data);

      } catch (err) {
        console.error('Error loading lecture data:', err);
        setError('Failed to load lecture. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (lectureId && userId) {
      loadLectureData();
    }
  }, [lectureId, userId]);

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-600">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={() => router.refresh()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (loading || !lecture || !progress) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mt-6"></div>
        <div className="p-6 space-y-6">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <LectureHeader lecture={lecture} />
      <WorkflowStageManager
        lecture={lecture}
        progress={progress}
        prerequisiteStatus={prerequisiteStatus}
        userId={userId}
        onProgressUpdate={(updatedProgress) => setProgress(updatedProgress)}
      />
    </div>
  );
}
