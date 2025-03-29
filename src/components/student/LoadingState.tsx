// src/components/student/LoadingState.tsx
import React from 'react';

interface LoadingStateProps {
  count?: number;
  className?: string;
}

/**
 * Component that displays a skeleton loading state for lecture cards
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  count = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(count).fill(0).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Card header - category and status */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Card body - title and description */}
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Card footer - action button */}
            <div className="p-4 border-t border-gray-100">
              <div className="h-9 w-full md:w-1/2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
