// src/components/student/lecture-detail/LectureContent.tsx

'use client';

import React, { useState } from 'react';

interface LectureContentProps {
  lecture: {
    id: string;
    title: string;
    contentUrl: string;
    contentType: string;
    embedAllowed: boolean;
    sourceAttribution: string;
    lecturerName: string;
  };
  onComplete?: () => void;
  readOnly?: boolean;
}

export default function LectureContent({ lecture, onComplete, readOnly = false }: LectureContentProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Parse YouTube video ID from URL if applicable
  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(lecture.contentUrl);

  // Start tracking watch time
  const startWatching = () => {
    setIsWatching(true);

    // Set up an interval to track time spent on the page
    const id = setInterval(() => {
      setWatchTime(prevTime => prevTime + 1);
    }, 1000);

    setIntervalId(id);
  };

  // Stop tracking watch time
  const stopWatching = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsWatching(false);
  };

  // Mark as complete after watching
  const handleCompleteWatching = () => {
    stopWatching();
    if (onComplete) {
      onComplete();
    }
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Lecture Content</h2>

      {/* Embedded YouTube video or external link */}
      <div className="relative">
        {youtubeId && lecture.embedAllowed ? (
          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="absolute top-0 left-0 w-full h-full"
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => !readOnly && startWatching()}
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
                onClick={() => !readOnly && startWatching()}
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
      <div className="text-sm text-gray-500">
        <p>
          Lecturer: {lecture.lecturerName}<br />
          Source: {lecture.sourceAttribution}
        </p>
      </div>

      {/* Watch timer and complete button */}
      {!readOnly && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {isWatching && (
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <svg
                className="mr-1 h-4 w-4 text-red-500 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Watching: {formatTime(watchTime)}
            </div>
          )}

          <button
            onClick={handleCompleteWatching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Mark as Watched
          </button>

          <p className="mt-1 text-xs text-gray-500">
            Click this button after you've finished watching the lecture.
          </p>
        </div>
      )}
    </div>
  );
}
