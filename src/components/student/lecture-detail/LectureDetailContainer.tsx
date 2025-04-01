// src/components/student/lecture-detail/LectureDetailContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PROGRESS_STATUS } from '@/lib/constants';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import LectureHeader from './LectureHeader';
import LectureNavigation from './LectureNavigation'; 
import WorkflowIndicator from './WorkflowIndicator';
import WorkflowStageManager from './WorkflowStageManager';
import { fetchLectureDetails } from '@/lib/services/lectureService';
import { getUserProgressForLecture } from '@/lib/services/progressService';
import { checkPrerequisitesSatisfied } from '@/lib/services/lectureService';

interface LectureDetailContainerProps {
  lectureId: string;
}

export default function LectureDetailContainer({ lectureId }: LectureDetailContainerProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [prerequisiteStatus, setPrerequisiteStatus] = useState<any>(null);
  const [previousLecture, setPreviousLecture] = useState<any>(null);
  const [nextLecture, setNextLecture] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // If session is not loaded yet, wait
        if (sessionStatus === 'loading') return;

        // If no session, redirect to login
        if (sessionStatus === 'unauthenticated') {
          router.push('/auth/signin');
          return;
        }

        setIsLoading(true);
        setError(null);

        // Step 1: Fetch lecture details
        const lectureResult = await fetchLectureDetails(lectureId);
        if (!lectureResult.success) {
          throw new Error(lectureResult.error || 'Failed to fetch lecture details');
        }
        setLecture(lectureResult.data);

        // Step 2: Get user's progress if authenticated
        if (session?.user?.id) {
          const progressResult = await getUserProgressForLecture(session.user.id, lectureId);

          if (progressResult.success) {
            setProgress(progressResult.data);
          } else {
            // If we can't get progress, set a default value
            setProgress({
              status: PROGRESS_STATUS.READY,
              userId: session.user.id,
              lectureId
            });
          }

          // Step 3: Check prerequisites
          const prerequisiteResult = await checkPrerequisitesSatisfied(session.user.id, lectureId);
          if (prerequisiteResult.success) {
            setPrerequisiteStatus(prerequisiteResult.data);
          } else {
            console.error('Failed to check prerequisites:', prerequisiteResult.error);
          }

          // Step 4: Fetch previous and next lectures
          // For now, let's use example data until you create the actual API endpoint
          setPreviousLecture({
            id: "prev-example-id",
            title: "Introduction to Philosophy",
            status: "MASTERED"
          });

          setNextLecture({
            id: "next-example-id",
            title: "Ancient Greek Philosophy",
            status: "READY"
          });

          // Ideally, you would add a proper API call like this:
          // const adjacentResult = await fetchAdjacentLectures(lectureId, session.user.id);
          // if (adjacentResult.success) {
          //   setPreviousLecture(adjacentResult.data.previous);
          //   setNextLecture(adjacentResult.data.next);
          // }
        } else {
          console.error("No user ID in session");
          setError("Authentication issue. Please sign in again.");
        }
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
  }, [lectureId, session, sessionStatus, router]);

  const handleProgressUpdate = (updatedProgress: any) => {
    setProgress(updatedProgress);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        message={error}
        actionLink="/dashboard"
        actionText="Return to Dashboard"
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <LectureHeader lecture={lecture} />

      {progress && <WorkflowIndicator currentStatus={progress.status || 'READY'} />}

      {lecture && progress && prerequisiteStatus && session?.user?.id && (
        <WorkflowStageManager
          lecture={lecture}
          progress={progress}
          prerequisiteStatus={prerequisiteStatus}
          userId={session.user.id}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* Add the LectureNavigation component here */}
      <LectureNavigation
        lectureId={lectureId}
        categoryId={lecture.category}
        previousLecture={previousLecture}
        nextLecture={nextLecture}
        showCategories={true}
      />

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
