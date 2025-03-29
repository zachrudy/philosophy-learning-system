// src/components/student/lecture-detail/NextStepsGuide.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentService } from '@/lib/services/studentService';
import StatusUtils from '@/lib/utils/statusUtils';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  contentUrl: string;
  order: number;
}

interface LectureAvailability {
  lecture: Lecture;
  isCompleted: boolean;
  isInProgress: boolean;
  isAvailable: boolean;
  status: string;
  readinessScore: number;
  prerequisitesSatisfied: boolean;
}

interface NextStepsGuideProps {
  userId: string;
  currentLectureId: string;
  currentCategory?: string;
  maxSuggestions?: number;
  hideCompleted?: boolean;
  className?: string;
}

const NextStepsGuide: React.FC<NextStepsGuideProps> = ({
  userId,
  currentLectureId,
  currentCategory,
  maxSuggestions = 3,
  hideCompleted = false,
  className = '',
}) => {
  const [suggestedLectures, setSuggestedLectures] = useState<LectureAvailability[]>([]);
  const [relatedLectures, setRelatedLectures] = useState<LectureAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextSteps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get suggested next lectures
        const suggestedResult = await StudentService.getSuggestedLectures({
          limit: maxSuggestions,
          category: currentCategory,
        });

        if (!suggestedResult.success) {
          throw new Error(suggestedResult.error || 'Failed to fetch suggested lectures');
        }

        // Filter out the current lecture from suggestions
        const filteredSuggestions = (suggestedResult.data || []).filter(
          item => item.lecture.id !== currentLectureId
        );

        // If hideCompleted is true, filter out completed lectures
        const suggestions = hideCompleted
          ? filteredSuggestions.filter(item => !item.isCompleted)
          : filteredSuggestions;

        setSuggestedLectures(suggestions);

        // Get all available lectures to find related ones in the same category
        const availableLecturesResult = await StudentService.getAvailableLectures({
          includeInProgress: true,
        });

        if (!availableLecturesResult.success) {
          throw new Error(availableLecturesResult.error || 'Failed to fetch available lectures');
        }

        // Find related lectures (same category as current lecture, excluding current lecture)
        const currentLecture = (availableLecturesResult.data || []).find(
          item => item.lecture.id === currentLectureId
        );

        if (currentLecture) {
          const currentLectureCategory = currentLecture.lecture.category;

          const related = (availableLecturesResult.data || [])
            .filter(item =>
              item.lecture.id !== currentLectureId &&
              item.lecture.category === currentLectureCategory
            )
            .sort((a, b) => {
              // Sort by: Available first, then by order
              if (a.isAvailable && !b.isAvailable) return -1;
              if (!a.isAvailable && b.isAvailable) return 1;
              return a.lecture.order - b.lecture.order;
            })
            .slice(0, maxSuggestions);

          setRelatedLectures(related);
        }
      } catch (err) {
        console.error('Error fetching next steps:', err);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId && currentLectureId) {
      fetchNextSteps();
    }
  }, [userId, currentLectureId, currentCategory, maxSuggestions, hideCompleted]);

  if (loading) {
    return <LoadingState count={1} />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        message={error}
        actionText="Try Again"
      />
    );
  }

  // Combine suggestions and related lectures, removing duplicates
  const allSuggestions = [...suggestedLectures];
  relatedLectures.forEach(related => {
    if (!allSuggestions.some(suggestion => suggestion.lecture.id === related.lecture.id)) {
      allSuggestions.push(related);
    }
  });

  // If no suggestions, show empty state
  if (allSuggestions.length === 0) {
    return (
      <EmptyState
        type="completed-all"
        message="You've completed all available lectures in this category. Check back later for new content."
        actionLink="/dashboard"
        actionText="View All Categories"
      />
    );
  }

  // Render the recommended lectures
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-blue-800">Continue Your Learning Journey</h2>
        <p className="mt-1 text-sm text-blue-600">
          Recommended next steps based on your progress and interests
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {suggestedLectures.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Recommended Based on Your Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedLectures.map((item) => (
                  <LectureRecommendationCard
                    key={item.lecture.id}
                    lecture={item.lecture}
                    status={item.status}
                    readinessScore={item.readinessScore}
                    isInProgress={item.isInProgress}
                    isCompleted={item.isCompleted}
                    isAvailable={item.isAvailable}
                    isSuggested={true}
                  />
                ))}
              </div>
            </div>
          )}

          {relatedLectures.length > 0 && !relatedLectures.every(lecture =>
            suggestedLectures.some(suggestion => suggestion.lecture.id === lecture.lecture.id)
          ) && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Related Lectures in This Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedLectures
                  .filter(related => !suggestedLectures.some(suggestion =>
                    suggestion.lecture.id === related.lecture.id
                  ))
                  .map((item) => (
                    <LectureRecommendationCard
                      key={item.lecture.id}
                      lecture={item.lecture}
                      status={item.status}
                      readinessScore={item.readinessScore}
                      isInProgress={item.isInProgress}
                      isCompleted={item.isCompleted}
                      isAvailable={item.isAvailable}
                      isSuggested={false}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            View All Lectures in Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

interface LectureRecommendationCardProps {
  lecture: Lecture;
  status: string;
  readinessScore: number;
  isInProgress: boolean;
  isCompleted: boolean;
  isAvailable: boolean;
  isSuggested: boolean;
}

const LectureRecommendationCard: React.FC<LectureRecommendationCardProps> = ({
  lecture,
  status,
  readinessScore,
  isInProgress,
  isCompleted,
  isAvailable,
  isSuggested,
}) => {
  const statusColors = StatusUtils.getStatusColor(status);
  const displayStatus = StatusUtils.getStatusDisplayName(status);
  const actionText = StatusUtils.getActionText(status);

  // Determine if lecture is locked
  const isLocked = !isAvailable && !isInProgress && !isCompleted;

  // Determine card highlight based on status
  const cardHighlight = isInProgress
    ? 'border-blue-200 bg-blue-50'
    : isCompleted
    ? 'border-green-200 bg-green-50'
    : isAvailable
    ? 'border-green-100 bg-white'
    : 'border-gray-200 bg-gray-50';

  return (
    <div className={`border rounded-lg overflow-hidden ${cardHighlight}`}>
      {isSuggested && (
        <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium">
          Recommended Next Step
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{lecture.title}</h4>
            <div className="flex items-center text-xs text-gray-500">
              <span className="font-medium">{lecture.category}</span>
              <span className="mx-1">•</span>
              <span>Lecture {lecture.order + 1}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
          >
            {displayStatus}
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{lecture.description}</p>

        {readinessScore !== undefined && !isCompleted && (
          <div className="mb-3">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Readiness:</span>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    readinessScore >= 70 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${readinessScore}%` }}
                  title={`${readinessScore}% ready`}
                ></div>
              </div>
              <span className="ml-2 text-xs font-medium text-gray-700">
                {Math.round(readinessScore)}%
              </span>
            </div>
          </div>
        )}

        <Link
          href={isLocked ? `/lectures/${lecture.id}/prerequisites` : `/lectures/${lecture.id}`}
          className={`w-full inline-block text-center px-3 py-2 rounded text-sm font-medium ${
            isLocked
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isInProgress
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : isCompleted
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } transition-colors`}
        >
          {actionText}
        </Link>
      </div>
    </div>
  );
};

export default NextStepsGuide;
