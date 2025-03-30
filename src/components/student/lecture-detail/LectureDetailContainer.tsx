// src/components/student/lecture-detail/LectureDetailContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LectureDetailContainerProps {
  lectureId: string;
  userId: string;
}

export default function LectureDetailContainer({ lectureId, userId }: LectureDetailContainerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecture, setLecture] = useState<any>(null);

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

  // If we got here, we have lecture data
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{lecture.title}</h1>
        <p className="text-gray-700 mb-6">{lecture.description}</p>

        <div className="flex space-x-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {lecture.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {lecture.lecturerName}
          </span>
        </div>

        <div className="mt-6">
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
