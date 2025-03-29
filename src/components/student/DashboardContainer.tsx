// src/components/student/DashboardContainer.tsx
import React, { useEffect, useState } from 'react';
import LectureCard from './LectureCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import StudentService from '@/lib/services/studentService';
import StatusUtils from '@/lib/utils/statusUtils';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  contentUrl: string;
  order: number;
}

interface LectureAvailability {
  lecture: Lecture;
  isCompleted: boolean;
  isInProgress: boolean;
  isAvailable: boolean;
  status: string;
  readinessScore: number;
  prerequisitesSatisfied: boolean;
}

/**
 * Container component for the student dashboard
 * Handles data fetching and display of available lectures
 */
const DashboardContainer: React.FC = () => {
  const [lectures, setLectures] = useState<LectureAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get available lectures including in-progress lectures
        const response = await StudentService.getAvailableLectures({
          includeInProgress: true,
        });

        setLectures(response.data || []);
      } catch (err) {
        console.error('Error fetching lectures:', err);
        setError('Failed to load lectures. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  // Sort lectures: In Progress first, then Available, then by category and order
  const sortedLectures = [...lectures].sort((a, b) => {
    // In Progress lectures first
    if (a.isInProgress && !b.isInProgress) return -1;
    if (!a.isInProgress && b.isInProgress) return 1;

    // Then Available lectures before Locked ones
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;

    // Then sort by category
    if (a.lecture.category !== b.lecture.category) {
      return a.lecture.category.localeCompare(b.lecture.category);
    }

    // Finally sort by order within category
    return a.lecture.order - b.lecture.order;
  });

  // Group lectures by category for display
  const lecturesByCategory = sortedLectures.reduce<Record<string, LectureAvailability[]>>(
    (acc, lecture) => {
      const category = lecture.lecture.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(lecture);
      return acc;
    },
    {}
  );

  if (loading) {
    return <LoadingState count={6} />;
  }

  if (error) {
    return <EmptyState type="error" message={error} />;
  }

  if (lectures.length === 0) {
    return <EmptyState type="no-lectures" />;
  }

  // Count in-progress and available lectures
  const inProgressCount = lectures.filter(l => l.isInProgress).length;
  const availableCount = lectures.filter(l => l.isAvailable && !l.isInProgress).length;

  return (
    <div className="space-y-8">
      {inProgressCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLectures
              .filter(item => item.isInProgress)
              .slice(0, 3) // Limit to 3 in-progress lectures
              .map(item => (
                <LectureCard
                  key={item.lecture.id}
                  lecture={item.lecture}
                  status={item.status}
                  isInProgress={item.isInProgress}
                  isCompleted={item.isCompleted}
                  readinessScore={item.readinessScore}
                />
              ))}
          </div>
        </div>
      )}

      {availableCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            {inProgressCount > 0 ? 'Available Lectures' : 'Start Learning'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLectures
              .filter(item => item.isAvailable && !item.isInProgress)
              .slice(0, 6) // Limit to 6 available lectures
              .map(item => (
                <LectureCard
                  key={item.lecture.id}
                  lecture={item.lecture}
                  status={item.status}
                  readinessScore={item.readinessScore}
                />
              ))}
          </div>
        </div>
      )}

      {/* Display locked lectures if there are only a few available lectures */}
      {availableCount < 3 &&
        sortedLectures.some(item => !item.isAvailable && !item.isInProgress && !item.isCompleted) && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Up Next</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLectures
                .filter(item => !item.isAvailable && !item.isInProgress && !item.isCompleted)
                .slice(0, 3) // Limit to 3 locked lectures
                .map(item => (
                  <LectureCard
                    key={item.lecture.id}
                    lecture={item.lecture}
                    status="LOCKED"
                    readinessScore={item.readinessScore}
                  />
                ))}
            </div>
          </div>
        )}

      {/* Show by category if we have many lectures */}
      {lectures.length > 9 && (
        <div className="mt-12 space-y-8">
          <h2 className="text-xl font-bold text-gray-800">All Lectures by Category</h2>

          {Object.entries(lecturesByCategory).map(([category, categoryLectures]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryLectures.map(item => (
                  <LectureCard
                    key={item.lecture.id}
                    lecture={item.lecture}
                    status={item.status}
                    isInProgress={item.isInProgress}
                    isCompleted={item.isCompleted}
                    readinessScore={item.readinessScore}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardContainer;
