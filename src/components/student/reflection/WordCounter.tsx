// src/components/student/reflection/WordCounter.tsx

import React from 'react';

interface WordCounterProps {
  currentCount: number;
  minimumCount: number;
  className?: string;
}

const WordCounter: React.FC<WordCounterProps> = ({
  currentCount,
  minimumCount,
  className = '',
}) => {
  // Determine if minimum count is met
  const isSufficient = currentCount >= minimumCount;

  // Dynamic styling based on count status
  const textColorClass = isSufficient ? 'text-green-600' : 'text-gray-500';
  const countColorClass = isSufficient ? 'text-green-700 font-medium' : 'text-gray-700';

  return (
    <div className={`text-sm flex items-center ${textColorClass} ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 mr-1 ${textColorClass}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span>
        Word Count: <span className={countColorClass}>{currentCount}</span>
        {!isSufficient && (
          <span> (minimum: {minimumCount})</span>
        )}
        {isSufficient && (
          <span className="ml-1 inline-flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </span>
    </div>
  );
};

export default WordCounter;
