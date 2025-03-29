// src/components/student/LectureCard.tsx
import React from 'react';
import Link from 'next/link';
import { PROGRESS_STATUS } from '@/lib/constants';
import StatusIndicator from './StatusIndicator';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  contentUrl: string;
  order: number;
}

interface LectureCardProps {
  lecture: Lecture;
  status: string;
  readinessScore?: number;
  isInProgress?: boolean;
  isCompleted?: boolean;
  className?: string;
}

/**
 * Card component to display individual lecture information with status
 */
const LectureCard: React.FC<LectureCardProps> = ({
  lecture,
  status,
  readinessScore,
  isInProgress = false,
  isCompleted = false,
  className = '',
}) => {
  const { id, title, description, category } = lecture;

  // Determine the action button text and URL based on status
  const getActionInfo = () => {
    if (isCompleted) {
      return {
        text: 'Review Lecture',
        href: `/lectures/${id}`,
        color: 'bg-green-100 text-green-800 hover:bg-green-200',
      };
    }

    if (isInProgress) {
      return {
        text: 'Continue',
        href: `/lectures/${id}`,
        color: 'bg-blue-600 text-white hover:bg-blue-700',
      };
    }

    if (status === PROGRESS_STATUS.LOCKED || status === 'LOCKED') {
      return {
        text: 'Prerequisites Required',
        href: `/lectures/${id}/prerequisites`,
        color: 'bg-gray-100 text-gray-500 cursor-not-allowed',
        disabled: true,
      };
    }

    return {
      text: 'Start Learning',
      href: `/lectures/${id}`,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
    };
  };

  const { text, href, color, disabled } = getActionInfo();

  // Truncate description to around 120 characters
  const truncatedDescription = description.length > 120
    ? `${description.substring(0, 120)}...`
    : description;

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Card header - category and status */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {category}
        </span>
        <StatusIndicator status={status} />
      </div>

      {/* Card body - title and description */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{truncatedDescription}</p>

        {/* Show readiness score if provided and not locked */}
        {readinessScore !== undefined && status !== PROGRESS_STATUS.LOCKED && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Readiness:</span>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${readinessScore}%` }}
                  title={`${readinessScore}% ready`}
                ></div>
              </div>
              <span className="ml-2 text-xs font-medium text-gray-700">
                {readinessScore}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card footer - action button */}
      <div className="p-4 border-t border-gray-100">
        {disabled ? (
          <button
            disabled
            className={`w-full sm:w-auto px-4 py-2 rounded text-sm font-medium ${color}`}
          >
            {text}
          </button>
        ) : (
          <Link
            href={href}
            className={`inline-block w-full sm:w-auto px-4 py-2 rounded text-sm font-medium ${color} transition-colors`}
          >
            {text}
          </Link>
        )}
      </div>
    </div>
  );
};

export default LectureCard;
