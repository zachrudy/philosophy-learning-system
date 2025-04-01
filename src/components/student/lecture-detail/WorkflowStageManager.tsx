// src/components/student/lecture-detail/WorkflowStageManager.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { PROGRESS_STATUS } from '@/lib/constants';
import PrerequisiteCheck from './PrerequisiteCheck';
import ViewingStage from './ViewingStage';
import PreLectureStage from './PreLectureStage';
import InitialReflectionStage from './InitialReflectionStage';
import MasteryTestingStage from './MasteryTestingStage';
import MasteredStage from './MasteredStage';
import { checkPrerequisitesSatisfied } from '@/lib/services/lectureService';
import LoadingState from '../LoadingState';

interface WorkflowStageManagerProps {
  lecture: {
    id: string;
    title: string;
    description: string;
    contentUrl: string;
    contentType: string;
    embedAllowed: boolean;
    sourceAttribution: string;
    lecturerName: string;
    preLecturePrompt: string;
    initialPrompt: string;
    masteryPrompt: string;
    evaluationPrompt: string;
    discussionPrompts: string;
    category: string;
    order: number;
  };
  progress: {
    id?: string;
    userId: string;
    lectureId: string;
    status: string;
    lastViewed?: string;
    completedAt?: string;
  };
  userId: string;
  prerequisiteStatus?: any;
  onProgressUpdate: (updatedProgress: any) => void;
}

export default function WorkflowStageManager({
  lecture,
  progress,
  userId,
  prerequisiteStatus: initialPrerequisiteStatus,
  onProgressUpdate
}: WorkflowStageManagerProps) {
  const [isLoading, setIsLoading] = useState(!initialPrerequisiteStatus);
  const [prerequisiteStatus, setPrerequisiteStatus] = useState(initialPrerequisiteStatus || { satisfied: false });
  const [error, setError] = useState<string | null>(null);
  const [nextLecture, setNextLecture] = useState<any>(null);

  // Fetch prerequisite status if not provided
  useEffect(() => {
    if (!initialPrerequisiteStatus) {
      const fetchPrerequisiteStatus = async () => {
        try {
          setIsLoading(true);
          const result = await checkPrerequisitesSatisfied(userId, lecture.id);

          if (result.success) {
            setPrerequisiteStatus(result.data);
          } else {
            console.error('Error checking prerequisites:', result.error);
            // Default to satisfied if we can't check prerequisites
            setPrerequisiteStatus({ satisfied: true });
          }
        } catch (err) {
          console.error('Error checking prerequisites:', err);
          setPrerequisiteStatus({ satisfied: true });
        } finally {
          setIsLoading(false);
        }
      };

      fetchPrerequisiteStatus();
    }
  }, [initialPrerequisiteStatus, userId, lecture.id]);

  // Handle workflow stage transitions
  const handleProgressUpdate = (updatedProgress: any) => {
    onProgressUpdate(updatedProgress);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  // Determine which component to render based on current progress status
  const renderWorkflowStage = () => {
    // Check if prerequisites are satisfied
    if (!prerequisiteStatus.satisfied && progress.status === PROGRESS_STATUS.LOCKED) {
      return (
        <PrerequisiteCheck
          prerequisites={prerequisiteStatus}
          lecture={lecture}
        />
      );
    }

    // Render based on current progress status
    switch (progress.status) {
      case PROGRESS_STATUS.LOCKED:
        // If we get here, prerequisites are satisfied but status is still LOCKED
        // Update to READY automatically
        setTimeout(() => {
          handleProgressUpdate({
            ...progress,
            status: PROGRESS_STATUS.READY
          });
        }, 0);
        return <LoadingState count={1} />;

      case PROGRESS_STATUS.READY:
        return (
          <PreLectureStage
            lecture={lecture}
            userId={userId}
            onProgressUpdate={handleProgressUpdate}
          />
        );

      case PROGRESS_STATUS.STARTED:
        return (
          <ViewingStage
            lecture={lecture}
            onProgressUpdate={handleProgressUpdate}
          />
        );

      case PROGRESS_STATUS.WATCHED:
        return (
          <InitialReflectionStage
            lecture={lecture}
            userId={userId}
            onProgressUpdate={handleProgressUpdate}
          />
        );

      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return (
          <MasteryTestingStage
            lecture={lecture}
            userId={userId}
            onProgressUpdate={handleProgressUpdate}
          />
        );

      case PROGRESS_STATUS.MASTERY_TESTING:
        return (
          <MasteryTestingStage
            lecture={lecture}
            userId={userId}
            onProgressUpdate={handleProgressUpdate}
          />
        );

      case PROGRESS_STATUS.MASTERED:
        return (
          <MasteredStage
            lecture={lecture}
            userId={userId}
            nextLecture={nextLecture}
          />
        );

      default:
        // If we don't recognize the status, default to READY
        setTimeout(() => {
          handleProgressUpdate({
            ...progress,
            status: PROGRESS_STATUS.READY
          });
        }, 0);
        return <LoadingState count={1} />;
    }
  };

  return (
    <div>
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {renderWorkflowStage()}
    </div>
  );
}
