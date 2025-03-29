// src/components/student/lecture-detail/MasteredStage.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLectureReflections } from '@/lib/services/reflectionService';
import LectureContent from './LectureContent';
import AIEvaluationResult from '../reflection/AIEvaluationResult';
import ReflectionPrompt from '../reflection/ReflectionPrompt';

interface MasteredStageProps {
  lecture: {
    id: string;
    title: string;
    description: string;
    contentUrl: string;
    contentType: string;
    embedAllowed: boolean;
    sourceAttribution: string;
    lecturerName: string;
    discussionPrompts: string;
    category: string;
    order: number;
  };
  userId: string;
  nextLecture?: {
    id: string;
    title: string;
  } | null;
}

const MasteredStage: React.FC<MasteredStageProps> = ({
  lecture,
  userId,
  nextLecture,
}) => {
  const [masteryReflection, setMasteryReflection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMasteryReflection = async () => {
      try {
        setLoading(true);
        const result = await getLectureReflections(lecture.id, userId, 'mastery');

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch mastery reflection');
        }

        // Get the most recent mastery reflection with evaluation
        const masteryReflections = result.data.filter(r =>
          r.promptType === 'mastery' &&
          r.status === 'EVALUATED' &&
          r.parsedEvaluation
        );

        if (masteryReflections.length > 0) {
          // Sort by date if there are multiple
          masteryReflections.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setMasteryReflection(masteryReflections[0]);
        }
      } catch (err) {
        console.error('Error fetching mastery reflection:', err);
        setError('Failed to load mastery reflection');
      } finally {
        setLoading(false);
      }
    };

    fetchMasteryReflection();
  }, [lecture.id, userId]);

  return (
    <div className="p-6 space-y-8">
      {/* Mastery Achievement Banner */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
            <div className="bg-green-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Mastery Achieved!</h2>
            <p className="text-green-700">
              Congratulations! You've demonstrated mastery of "{lecture.title}".
              This lecture is now marked as completed in your learning journey.
            </p>
          </div>
        </div>
      </div>

      {/* Mastery Reflection & Evaluation */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">
          {error}
        </div>
      ) : masteryReflection ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-blue-800">Your Mastery Reflection</h3>
          </div>
          <div className="p-4">
            <div className="bg-gray-50 p-4 rounded-md mb-4 whitespace-pre-wrap">
              {masteryReflection.content}
            </div>

            {masteryReflection.parsedEvaluation && (
              <AIEvaluationResult
                evaluation={masteryReflection.parsedEvaluation}
                mastered={true}
                className="mt-4"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">No mastery reflection found.</p>
        </div>
      )}

      {/* Lecture Content for Review */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-700">Review Lecture Content</h3>
        </div>
        <div className="p-4">
          <LectureContent
            lecture={lecture}
            readOnly={true}
          />
        </div>
      </div>

      {/* Discussion Prompts Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-indigo-800">Further Discussion</h3>
        </div>
        <div className="p-4">
          <ReflectionPrompt
            lecture={lecture}
            promptType="discussion"
          />

          <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Activities:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Discuss these prompts with peers or in study groups</li>
              <li>Write an extended essay on one of the discussion topics</li>
              <li>Research related philosophical concepts mentioned in the prompts</li>
              <li>Connect ideas from this lecture to other lectures you've completed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-blue-800">What's Next?</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/lectures/${lecture.id}/reflections`}
              className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm hover:bg-gray-50"
            >
              <div className="font-medium text-gray-800 mb-1">View All Reflections</div>
              <p className="text-gray-600">Review your complete reflection history for this lecture</p>
            </Link>

            <Link
              href="/dashboard"
              className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm hover:bg-gray-50"
            >
              <div className="font-medium text-gray-800 mb-1">Return to Dashboard</div>
              <p className="text-gray-600">See all available lectures and continue your journey</p>
            </Link>

            {nextLecture && (
              <Link
                href={`/lectures/${nextLecture.id}`}
                className="flex-1 bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm hover:bg-blue-100"
              >
                <div className="font-medium text-blue-800 mb-1">Continue to Next Lecture</div>
                <p className="text-blue-600">{nextLecture.title}</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasteredStage;
