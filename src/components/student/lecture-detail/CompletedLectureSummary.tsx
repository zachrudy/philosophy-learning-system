// src/components/student/lecture-detail/CompletedLectureSummary.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { reflectionService } from '@/lib/services/reflectionService';
import AIEvaluationResult from '../reflection/AIEvaluationResult';
import StatusIndicator from '../StatusIndicator';
import { PROGRESS_STATUS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface CompletedLectureSummaryProps {
  lecture: {
    id: string;
    title: string;
    description: string;
    category: string;
    order: number;
    lecturerName: string;
  };
  progress: {
    id: string;
    status: string;
    lastViewed: string;
    completedAt: string;
    updatedAt: string;
  };
  userId: string;
  nextLecture?: {
    id: string;
    title: string;
  } | null;
  className?: string;
}

const CompletedLectureSummary: React.FC<CompletedLectureSummaryProps> = ({
  lecture,
  progress,
  userId,
  nextLecture,
  className = '',
}) => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [masteryReflection, setMasteryReflection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await reflectionService.getLectureReflections(lecture.id, userId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch reflections');
        }

        // Store all reflections
        setReflections(result.data || []);

        // Find the most recent mastery reflection with evaluation
        const masteryReflections = (result.data || []).filter(r =>
          r.promptType === 'mastery' &&
          r.status === 'EVALUATED' &&
          r.parsedEvaluation
        );

        if (masteryReflections.length > 0) {
          // Sort by date descending to get the latest
          masteryReflections.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setMasteryReflection(masteryReflections[0]);
        }
      } catch (err) {
        console.error('Error fetching reflections:', err);
        setError('Failed to load reflection data');
      } finally {
        setLoading(false);
      }
    };

    if (lecture.id && userId) {
      fetchReflections();
    }
  }, [lecture.id, userId]);

  // Group reflections by promptType
  const reflectionsByType = reflections.reduce<Record<string, any[]>>((acc, reflection) => {
    const type = reflection.promptType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(reflection);
    return acc;
  }, {});

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-6 ${className}`}>
        <div className="text-red-700">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const completionDate = progress.completedAt ? formatDisplayDate(progress.completedAt) : 'Not completed';
  const hasProvidedNextLecture = nextLecture && nextLecture.id;

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-green-50 border-b border-green-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-green-900">Learning Journey Summary</h2>
          <StatusIndicator status={PROGRESS_STATUS.MASTERED} />
        </div>
        <p className="mt-1 text-sm text-green-700">
          Completed on {completionDate}
        </p>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {/* Completion Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Total Reflections</h3>
            <p className="text-2xl font-bold text-blue-900">{reflections.length}</p>
            <p className="text-xs text-blue-700 mt-1">
              Across {Object.keys(reflectionsByType).length} reflection stages
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-1">Time to Complete</h3>
            <p className="text-2xl font-bold text-purple-900">
              {reflections.length > 0 ?
                Math.ceil((new Date(progress.completedAt || progress.updatedAt).getTime() -
                new Date(reflections[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                : 'N/A'}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              From first reflection to mastery
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-1">Mastery Score</h3>
            <p className="text-2xl font-bold text-green-900">
              {masteryReflection ?
                masteryReflection.parsedEvaluation.score.toFixed(1) + '/100' :
                'Not evaluated'}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {masteryReflection && masteryReflection.parsedEvaluation.score >= 70 ?
                'Successfully achieved mastery' :
                'Mastery threshold: 70/100'}
            </p>
          </div>
        </div>

        {/* Reflection Progress Timeline */}
        {reflections.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Your Learning Journey</h3>
            <div className="relative border-l-2 border-blue-200 pl-6 pb-2">
              {Object.entries(reflectionsByType).map(([promptType, typeReflections], index) => {
                // Sort reflections by date
                const sortedReflections = [...typeReflections].sort((a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                const firstReflection = sortedReflections[0];

                return (
                  <div key={promptType} className="mb-4 relative">
                    {/* Timeline dot */}
                    <div className="absolute w-4 h-4 rounded-full bg-blue-500 -left-8 top-1 border-2 border-white"></div>
                    <div className={`bg-gray-50 rounded-lg p-4 border ${index === Object.entries(reflectionsByType).length - 1 ? 'border-green-300' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {reflectionService.getPromptLabel(promptType)}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDisplayDate(firstReflection.createdAt)}
                          </p>
                        </div>
                        <div className="text-xs bg-blue-100 rounded-full px-2 py-1 text-blue-800">
                          {typeReflections.length} {typeReflections.length === 1 ? 'submission' : 'submissions'}
                        </div>
                      </div>
                      {/* Show snippet of the reflection */}
                      {firstReflection && (
                        <div className="mt-2 text-sm text-gray-600 italic border-l-4 border-gray-200 pl-3">
                          "{reflectionService.formatReflectionForDisplay(firstReflection.content, 150)}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Final completion marker */}
              <div className="absolute w-5 h-5 rounded-full bg-green-500 -left-8 bottom-0 border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm text-green-700 font-medium">
                Mastery Achieved!
              </div>
            </div>
          </div>
        )}

        {/* Mastery Evaluation Summary */}
        {masteryReflection && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Mastery Evaluation</h3>
            <AIEvaluationResult
              evaluation={masteryReflection.parsedEvaluation}
              mastered={true}
              compact={true}
            />
          </div>
        )}

        {/* Next Steps */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
            <h3 className="text-md font-medium text-blue-800">Continue Your Journey</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/lectures/${lecture.id}/reflections`}
                className="flex-1 bg-white border border-gray-300 rounded-md p-3 text-center hover:bg-gray-50"
              >
                <div className="font-medium text-gray-800 mb-1">View All Reflections</div>
                <p className="text-xs text-gray-600">Review your complete reflection history</p>
              </Link>

              {hasProvidedNextLecture ? (
                <Link
                  href={`/lectures/${nextLecture.id}`}
                  className="flex-1 bg-blue-50 border border-blue-300 rounded-md p-3 text-center hover:bg-blue-100"
                >
                  <div className="font-medium text-blue-800 mb-1">Continue to Next Lecture</div>
                  <p className="text-xs text-blue-700">{nextLecture.title}</p>
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex-1 bg-green-50 border border-green-300 rounded-md p-3 text-center hover:bg-green-100"
                >
                  <div className="font-medium text-green-800 mb-1">Return to Dashboard</div>
                  <p className="text-xs text-green-700">Find your next lecture</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedLectureSummary;
