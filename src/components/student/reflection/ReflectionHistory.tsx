// src/components/student/reflection/ReflectionHistory.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { getLectureReflections } from '@/lib/services/reflectionService';
import AIEvaluationResult from './AIEvaluationResult';

interface Reflection {
  id: string;
  promptType: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  score?: number;
  parsedEvaluation?: {
    feedback: string;
    areas: {
      strength: string[];
      improvement: string[];
    };
    conceptualUnderstanding: number;
    criticalThinking: number;
  } | null;
}

interface ReflectionHistoryProps {
  lectureId: string;
  userId: string;
  promptType?: string;
  sortOrder?: 'newest' | 'oldest';
  showAIFeedback?: boolean;
  className?: string;
}

const ReflectionHistory: React.FC<ReflectionHistoryProps> = ({
  lectureId,
  userId,
  promptType,
  sortOrder = 'newest',
  showAIFeedback = true,
  className = ''
}) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(promptType || 'all');

  useEffect(() => {
    // Update active tab when promptType prop changes
    if (promptType) {
      setActiveTab(promptType);
    }
  }, [promptType]);

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getLectureReflections(lectureId, userId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch reflections');
        }

        setReflections(result.data || []);
      } catch (err) {
        console.error('Error fetching reflections:', err);
        setError('Failed to load reflection history');
      } finally {
        setLoading(false);
      }
    };

    fetchReflections();
  }, [lectureId, userId]);

  // Get prompt type display name
  const getPromptTypeDisplay = (type: string): string => {
    switch (type) {
      case 'pre-lecture':
        return 'Pre-Lecture';
      case 'initial':
        return 'Initial';
      case 'mastery':
        return 'Mastery';
      case 'discussion':
        return 'Discussion';
      default:
        return type;
    }
  };

  // Format date nicely
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter reflections based on active tab
  const filteredReflections = activeTab === 'all'
    ? reflections
    : reflections.filter(reflection => reflection.promptType === activeTab);

  // Organize reflections by prompt type
  const reflectionsByType = reflections.reduce<Record<string, number>>((acc, reflection) => {
    acc[reflection.promptType] = (acc[reflection.promptType] || 0) + 1;
    return acc;
  }, {});

  // Sort reflections by date
  const sortedReflections = [...filteredReflections].sort(
    (a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    }
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-6 ${className}`}>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (reflections.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-gray-500 italic">No reflections found for this lecture.</p>
      </div>
    );
  }

  // Don't show tabs if promptType is provided externally
  const showTabs = !promptType;

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Tabs - only show if not externally filtered */}
      {showTabs && (
        <div className="border-b border-gray-200">
          <div className="px-6 flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Reflections ({reflections.length})
            </button>

            {Object.entries(reflectionsByType).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`py-3 px-4 text-sm font-medium border-b-2 ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getPromptTypeDisplay(type)} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reflections List */}
      <div className="px-6 py-4">
        {sortedReflections.length === 0 ? (
          <p className="text-gray-500 italic">No reflections found for the selected type.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedReflections.map((reflection) => (
              <li key={reflection.id} className="py-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      {getPromptTypeDisplay(reflection.promptType)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(reflection.createdAt)}
                    </span>
                  </div>

                  {reflection.status === 'EVALUATED' && reflection.score !== undefined && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reflection.score >= 70
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      Score: {reflection.score}
                    </span>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap">
                    {reflection.content}
                  </div>
                </div>

                {showAIFeedback && reflection.parsedEvaluation && (
                  <div className="mt-4">
                    <AIEvaluationResult
                      evaluation={reflection.parsedEvaluation}
                      mastered={reflection.score ? reflection.score >= 70 : false}
                      compact={true}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReflectionHistory;
