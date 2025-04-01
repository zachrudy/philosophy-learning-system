// src/components/student/lecture-detail/LectureDetailContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // Add this import
import Link from 'next/link';
import { PROGRESS_STATUS } from '@/lib/constants';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import LectureHeader from './LectureHeader';
import WorkflowIndicator from './WorkflowIndicator';
import ViewingStage from './ViewingStage';
import { getUserProgressForLecture } from '@/lib/services/progressService';

interface LectureDetailContainerProps {
  lectureId: string;
}

export default function LectureDetailContainer({ lectureId, userId }: LectureDetailContainerProps) {
  console.log("LectureDetailContainer userId:", userId);

  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // Get session data directly
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

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

        // Fetch lecture data
        const response = await fetch(`/api/lectures/${lectureId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch lecture: ${response.status}`);
        }

        const data = await response.json();
        setLecture(data);

        // Get progress data if user is authenticated
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

      <WorkflowIndicator currentStatus={progress?.status || 'READY'} />

      <ViewingStage
        lecture={lecture}
        userId={userId}
        onProgressUpdate={handleProgressUpdate}
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
