// src/components/student/lecture-detail/ViewingStage.tsx

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react'; // Add this import
import { updateProgressStatus } from '@/lib/services/progressService';
import { PROGRESS_STATUS } from '@/lib/constants';

interface ViewingStageProps {
  lecture: {
    id: string;
    title: string;
    contentUrl: string;
    contentType: string;
    embedAllowed: boolean;
    sourceAttribution: string;
    lecturerName: string;
  };
  onProgressUpdate: (newStatus: string) => void;
}

const ViewingStage: React.FC<ViewingStageProps> = ({
  lecture,
  onProgressUpdate
}) => {
  const { data: session } = useSession(); // Get session data directly
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse YouTube video ID from URL if applicable
  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(lecture.contentUrl);

  // Mark lecture as viewed
  const handleMarkAsViewed = async () => {
    try {
      setIsMarking(true);
      setError(null);

      console.log('Marking lecture as viewed:', lecture.id);

      // Use the direct endpoint to mark as viewed
      const response = await fetch(`/api/student/lectures/${lecture.id}/viewed`, {
        method: 'POST',
      });

      console.log('Mark as viewed response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error marking lecture as viewed:', errorText);
        throw new Error('Failed to mark lecture as viewed');
      }

      const result = await response.json();
      console.log('Mark as viewed result:', result);

      // Notify parent component of the status change
      onProgressUpdate(PROGRESS_STATUS.WATCHED);
    } catch (err) {
      console.error('Error marking lecture as viewed:', err);
      setError('Failed to mark lecture as viewed. Please try again.');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Lecture Content</h2>

      {/* Embedded YouTube video or external link */}
      <div className="mb-6">
        {youtubeId && lecture.embedAllowed ? (
          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="absolute top-0 left-0 w-full h-full"
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-800">
              This lecture content is available at:{' '}
              <a
                href={lecture.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {lecture.contentUrl}
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please click the link above to view the content in a new tab.
            </p>
          </div>
        )}
      </div>

      {/* Source attribution */}
      <div className="text-sm text-gray-500 mb-6">
        <p>
          Lecturer: {lecture.lecturerName}<br />
          Source: {lecture.sourceAttribution}
        </p>
      </div>

      {/* Complete button */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="text-sm text-blue-700">
            Please watch the lecture content completely before moving to the next step.
            When you've finished watching, click the button below to continue.
          </p>
        </div>

        <button
          onClick={handleMarkAsViewed}
          disabled={isMarking}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isMarking ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isMarking ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Mark as Watched'
          )}
        </button>

        <p className="mt-2 text-xs text-gray-500">
          This will update your progress and allow you to move to the reflection stage.
        </p>
      </div>
    </div>
  );
};

export default ViewingStage;
