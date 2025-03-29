// src/components/student/lecture-detail/PrerequisiteCheck.tsx

'use client';

import React from 'react';
import Link from 'next/link';

interface Prerequisite {
  id: string;
  lectureId: string;
  prerequisiteLectureId: string;
  isRequired: boolean;
  importanceLevel: number;
  prerequisiteLecture: {
    id: string;
    title: string;
    category: string;
  };
}

interface PrerequisiteCheckProps {
  prerequisites: {
    satisfied: boolean;
    requiredPrerequisites: Prerequisite[];
    completedPrerequisites: Prerequisite[];
    missingRequiredPrerequisites: Prerequisite[];
    recommendedPrerequisites: Prerequisite[];
    completedRecommendedPrerequisites: Prerequisite[];
    readinessScore: number;
  };
  lecture: {
    id: string;
    title: string;
  };
}

export default function PrerequisiteCheck({ prerequisites, lecture }: PrerequisiteCheckProps) {
  // If prerequisites are satisfied, don't block access
  if (prerequisites.satisfied) {
    return null;
  }

  // Function to render a prerequisite item
  const renderPrerequisiteItem = (prerequisite: Prerequisite, isCompleted: boolean) => (
    <li key={prerequisite.id} className="py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full ${
          isCompleted ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
        }`}>
          {isCompleted ? (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">
            {prerequisite.prerequisiteLecture.title}
          </p>
          <p className="text-xs text-gray-500">
            {prerequisite.prerequisiteLecture.category}
            {prerequisite.importanceLevel > 0 && (
              <span className="ml-2">
                Importance: {Array(prerequisite.importanceLevel).fill('★').join('')}
              </span>
            )}
          </p>
        </div>
      </div>
      {!isCompleted && (
        <Link
          href={`/lectures/${prerequisite.prerequisiteLectureId}`}
          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Lecture
        </Link>
      )}
    </li>
  );

  return (
    <div className="p-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Prerequisites Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You need to complete the required prerequisites before accessing this lecture.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Lecture: {lecture.title}
      </h2>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="ml-3 text-sm text-blue-700">
            Your readiness score: <span className="font-bold">{prerequisites.readinessScore}%</span>
            {prerequisites.readinessScore < 70 ?
              ' (70% needed to unlock)' :
              ' (Missing required prerequisites)'
            }
          </p>
        </div>
      </div>

      {/* Required Prerequisites */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">
          Required Prerequisites ({prerequisites.completedRequiredPrerequisites.length}/{prerequisites.requiredPrerequisites.length})
        </h3>
        {prerequisites.requiredPrerequisites.length > 0 ? (
          <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {prerequisites.requiredPrerequisites.map(prerequisite => {
              const isCompleted = prerequisites.completedPrerequisites.some(
                p => p.prerequisiteLectureId === prerequisite.prerequisiteLectureId
              );
              return renderPrerequisiteItem(prerequisite, isCompleted);
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No required prerequisites</p>
        )}
      </div>

      {/* Recommended Prerequisites */}
      {prerequisites.recommendedPrerequisites.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-2">
            Recommended Prerequisites ({prerequisites.completedRecommendedPrerequisites.length}/{prerequisites.recommendedPrerequisites.length})
          </h3>
          <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {prerequisites.recommendedPrerequisites.map(prerequisite => {
              const isCompleted = prerequisites.completedRecommendedPrerequisites.some(
                p => p.prerequisiteLectureId === prerequisite.prerequisiteLectureId
              );
              return renderPrerequisiteItem(prerequisite, isCompleted);
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
