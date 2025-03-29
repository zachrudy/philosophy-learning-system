// src/components/student/reflection/ReflectionHistoryContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getLectureReflections } from '@/lib/services/reflectionService';
import ReflectionHistory from './ReflectionHistory';
import EmptyState from '../EmptyState';
import LoadingState from '../LoadingState';

interface ReflectionHistoryContainerProps {
  lectureId: string;
  userId: string;
}

const ReflectionHistoryContainer: React.FC<ReflectionHistoryContainerProps> = ({
  lectureId,
  userId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [promptFilter, setPromptFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [showAIFeedback, setShowAIFeedback] = useState(true);

  useEffect(() => {
    const fetchLectureDetails = async () => {
      try {
        // Fetch the lecture details to show title and other metadata
        const response = await fetch(`/api/lectures/${lectureId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch lecture details');
        }

        const data = await response.json();
        setLecture(data);
      } catch (err) {
        console.error('Error fetching lecture details:', err);
        setError('Could not load lecture information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectureDetails();
  }, [lectureId]);

  const handleExportReflections = async () => {
    try {
      window.open(`/api/reflections/export?userId=${userId}&lectureId=${lectureId}`, '_blank');
    } catch (err) {
      console.error('Error exporting reflections:', err);
      setError('Failed to export reflections');
    }
  };

  if (isLoading) {
    return <LoadingState className="mt-4" />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        message={error}
        actionLink={`/lectures/${lectureId}`}
        actionText="Return to Lecture"
      />
    );
  }

  if (!lecture) {
    return (
      <EmptyState
        type="error"
        message="Lecture not found"
        actionLink="/dashboard"
        actionText="Return to Dashboard"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-blue-50">
          <h2 className="text-lg font-medium text-blue-900">
            {lecture.title} - Reflections
          </h2>
          <p className="mt-1 text-sm text-blue-700">
            Review all your reflections for this lecture
          </p>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="prompt-filter" className="text-sm font-medium text-gray-700">
                Filter by:
              </label>
              <select
                id="prompt-filter"
                value={promptFilter}
                onChange={(e) => setPromptFilter(e.target.value)}
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Reflections</option>
                <option value="pre-lecture">Pre-Lecture</option>
                <option value="initial">Initial</option>
                <option value="mastery">Mastery</option>
                <option value="discussion">Discussion</option>
              </select>

              <select
                id="date-sort"
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  id="show-ai-feedback"
                  type="checkbox"
                  checked={showAIFeedback}
                  onChange={() => setShowAIFeedback(!showAIFeedback)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-ai-feedback" className="ml-2 text-sm text-gray-700">
                  Show AI Feedback
                </label>
              </div>

              <button
                onClick={handleExportReflections}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export as Markdown
              </button>
            </div>
          </div>
        </div>

        <ReflectionHistory
          lectureId={lectureId}
          userId={userId}
          promptType={promptFilter !== 'all' ? promptFilter : undefined}
          sortOrder={dateSort}
          showAIFeedback={showAIFeedback}
        />
      </div>
    </div>
  );
};

export default ReflectionHistoryContainer;
