// src/components/student/lecture-detail/LectureDetailContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PROGRESS_STATUS } from '@/lib/constants';
import ViewingStage from './ViewingStage';

interface LectureDetailContainerProps {
  lectureId: string;
  userId: string;
}

export default function LectureDetailContainer({ lectureId, userId }: LectureDetailContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [progress, setProgress] = useState<any>({
    status: PROGRESS_STATUS.STARTED, // Default to STARTED for testing
    lectureId: lectureId,
    userId: userId
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Simple fetch that doesn't depend on other functions
        const response = await fetch(`/api/lectures/${lectureId}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Lecture not found');
          } else {
            throw new Error(`Error fetching lecture: ${response.status}`);
          }
        }

        const data = await response.json();
        console.log('Lecture data:', data);

        if (!data) {
          throw new Error('No data returned from API');
        }

        setLecture(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (lectureId) {
      fetchData();
    }
  }, [lectureId]);

  // Handle updating progress status
  const handleProgressUpdate = (newStatus: string) => {
    setProgress(prev => ({ ...prev, status: newStatus }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-yellow-600 mb-2">Lecture Not Found</h3>
            <p className="text-gray-600 mb-4">The requested lecture could not be found or loaded.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Simple Header */}
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
        <p className="mt-1 text-gray-600">{lecture.description}</p>
      </div>

      {/* Render the ViewingStage component */}
      <ViewingStage
        lecture={lecture}
        userId={userId}
        onProgressUpdate={handleProgressUpdate}
      />

      {/* Simple Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Return to Dashboard
          </Link>
          {progress.status === PROGRESS_STATUS.WATCHED && (
            <div className="text-sm text-green-600">
              Marked as Watched! Next: Reflection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
