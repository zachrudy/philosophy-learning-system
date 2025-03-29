import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  type?: 'no-lectures' | 'completed-all' | 'error';
  message?: string;
  actionLink?: string;
  actionText?: string;
}

/**
 * Component to display when there are no lectures or an error occurs
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-lectures',
  message,
  actionLink,
  actionText,
}) => {
  // Default messages and actions based on type
  let title = '';
  let defaultMessage = '';
  let defaultAction = '';
  let icon = '';

  switch (type) {
    case 'no-lectures':
      title = 'No Lectures Available';
      defaultMessage = 'There are no lectures available for you at the moment.';
      defaultAction = 'Return to Dashboard';
      icon = '📚';
      break;
    case 'completed-all':
      title = 'All Caught Up!';
      defaultMessage = 'You have completed all available lectures. Check back later for new content.';
      defaultAction = 'Review Completed Lectures';
      icon = '🎉';
      break;
    case 'error':
      title = 'Oops, Something Went Wrong';
      defaultMessage = 'We encountered an error while loading your lectures.';
      defaultAction = 'Try Again';
      icon = '⚠️';
      break;
    default:
      title = 'No Content';
      defaultMessage = 'No content available.';
      defaultAction = 'Return Home';
      icon = '🔍';
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 text-center my-8 max-w-lg mx-auto">
      <div className="flex flex-col items-center">
        <span className="text-4xl mb-4">{icon}</span>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message || defaultMessage}</p>

        {actionLink && (
          <Link
            href={actionLink}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {actionText || defaultAction}
          </Link>
        )}

        {!actionLink && type === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {actionText || defaultAction}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
