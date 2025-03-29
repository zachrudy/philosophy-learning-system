import React from 'react';
import { PROGRESS_STATUS } from '@/lib/constants';

interface StatusIndicatorProps {
  status: string;
  variant?: 'pill' | 'dot' | 'badge';
  className?: string;
}

/**
 * Component to visually represent lecture status with appropriate colors and labels
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant = 'pill',
  className = '',
}) => {
  // Define status colors and labels
  const getStatusInfo = (status: string) => {
    switch (status) {
      case PROGRESS_STATUS.LOCKED:
        return { color: 'bg-gray-200 text-gray-700', label: 'Locked', icon: '🔒' };
      case PROGRESS_STATUS.READY:
        return { color: 'bg-green-100 text-green-800', label: 'Ready', icon: '✓' };
      case PROGRESS_STATUS.STARTED:
        return { color: 'bg-blue-100 text-blue-800', label: 'Started', icon: '▶' };
      case PROGRESS_STATUS.WATCHED:
        return { color: 'bg-indigo-100 text-indigo-800', label: 'Watched', icon: '👁️' };
      case PROGRESS_STATUS.INITIAL_REFLECTION:
        return { color: 'bg-purple-100 text-purple-800', label: 'Reflecting', icon: '✏️' };
      case PROGRESS_STATUS.MASTERY_TESTING:
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Testing', icon: '🧠' };
      case PROGRESS_STATUS.MASTERED:
        return { color: 'bg-green-200 text-green-900', label: 'Mastered', icon: '🏆' };
      // Additional status for displaying to students
      case 'IN_PROGRESS':
        return { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: '⏳' };
      case 'AVAILABLE':
        return { color: 'bg-green-100 text-green-800', label: 'Available', icon: '✓' };
      case 'COMPLETED':
        return { color: 'bg-green-200 text-green-900', label: 'Completed', icon: '🏆' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: '❓' };
    }
  };

  const { color, label, icon } = getStatusInfo(status);

  // Render different variants
  if (variant === 'dot') {
    return (
      <div className={`flex items-center space-x-1.5 ${className}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.split(' ')[0]}`}></span>
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className={`w-2 h-2 rounded-full mr-1.5 ${color.split(' ')[0]}`}></span>
        <span className={`text-xs font-medium ${color.split(' ')[1]}`}>{label}</span>
      </div>
    );
  }

  // Default pill variant
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
      title={`Status: ${label}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </span>
  );
};

export default StatusIndicator;
