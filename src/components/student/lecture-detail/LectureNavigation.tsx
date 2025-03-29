// src/components/student/lecture-detail/LectureNavigation.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusUtils from '@/lib/utils/statusUtils';

interface LectureNavigationProps {
  lectureId: string;
  categoryId?: string;
  previousLecture?: {
    id: string;
    title: string;
    status?: string;
  } | null;
  nextLecture?: {
    id: string;
    title: string;
    status?: string;
  } | null;
  showCategories?: boolean;
  className?: string;
}

const LectureNavigation: React.FC<LectureNavigationProps> = ({
  lectureId,
  categoryId,
  previousLecture,
  nextLecture,
  showCategories = false,
  className = '',
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories if needed
  useEffect(() => {
    if (showCategories) {
      const fetchCategories = async () => {
        try {
          setLoading(true);
          // This would be an API call in a real implementation
          // For now, we'll simulate some categories
          setCategories([
            { id: 'introductions', name: 'Introductions' },
            { id: 'ancient-philosophy', name: 'Ancient Philosophy' },
            { id: 'medieval-philosophy', name: 'Medieval Philosophy' },
            { id: 'modern-philosophy', name: 'Modern Philosophy' },
          ]);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCategories();
    }
  }, [showCategories]);

  // Get status display information
  const getStatusInfo = (status?: string) => {
    if (!status) return { color: 'bg-gray-100 text-gray-500', label: 'Unknown' };

    return {
      color: StatusUtils.getStatusColor(status).bg + ' ' + StatusUtils.getStatusColor(status).text,
      label: StatusUtils.getStatusDisplayName(status)
    };
  };

  return (
    <div className={`border-t border-gray-200 ${className}`}>
      <div className="px-4 py-4 sm:px-6">
        {/* Previous/Next Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {previousLecture ? (
              <Link
                href={`/lectures/${previousLecture.id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous: {previousLecture.title.length > 25
                  ? previousLecture.title.substring(0, 25) + '...'
                  : previousLecture.title
                }
                {previousLecture.status && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getStatusInfo(previousLecture.status).color}`}>
                    {getStatusInfo(previousLecture.status).label}
                  </span>
                )}
              </Link>
            ) : (
              <span className="text-sm text-gray-400">
                No previous lecture
              </span>
            )}
          </div>

          <div className="text-right">
            {nextLecture ? (
              <Link
                href={`/lectures/${nextLecture.id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                Next: {nextLecture.title.length > 25
                  ? nextLecture.title.substring(0, 25) + '...'
                  : nextLecture.title
                }
                {nextLecture.status && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getStatusInfo(nextLecture.status).color}`}>
                    {getStatusInfo(nextLecture.status).label}
                  </span>
                )}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="text-sm text-gray-400">
                No next lecture
              </span>
            )}
          </div>
        </div>

        {/* Category Navigation */}
        {showCategories && categories.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Course Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={`/dashboard?category=${category.id}`}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    category.id === categoryId
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Return to Dashboard */}
        <div className="mt-4 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LectureNavigation;
