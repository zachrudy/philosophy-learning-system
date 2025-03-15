'use client';

import React, { useState, useEffect } from 'react';

// Define the lecture type for the prerequisites
interface Lecture {
  id: string;
  title: string;
  category: string;
  order: number;
}

// Define the prerequisite type
interface Prerequisite {
  id: string;
  isRequired: boolean;
  importanceLevel: number;
}

interface PrerequisiteSelectProps {
  lectureId?: string; // Current lecture ID (optional, for edit mode)
  selectedPrerequisites: Prerequisite[]; // Currently selected prerequisites
  onChange: (prerequisites: Prerequisite[]) => void; // Callback when selection changes
}

const PrerequisiteSelect: React.FC<PrerequisiteSelectProps> = ({
  lectureId,
  selectedPrerequisites,
  onChange
}) => {
  const [availableLectures, setAvailableLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Map of lecture IDs to their details for easy lookup
  const [lectureMap, setLectureMap] = useState<Record<string, Lecture>>({});

  // Load available lectures
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/lectures?limit=100');

        if (!response.ok) {
          throw new Error('Failed to fetch lectures');
        }

        const data = await response.json();

        // Filter out the current lecture if we're in edit mode
        const filteredLectures = lectureId
          ? data.data.filter((lecture: Lecture) => lecture.id !== lectureId)
          : data.data;

        setAvailableLectures(filteredLectures);

        // Create a map for easy lookup
        const lectureMapping: Record<string, Lecture> = {};
        filteredLectures.forEach((lecture: Lecture) => {
          lectureMapping[lecture.id] = lecture;
        });
        setLectureMap(lectureMapping);
      } catch (err) {
        console.error('Error fetching lectures:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, [lectureId]);

  // Handle selecting a prerequisite
  const handlePrerequisiteToggle = (lectureId: string) => {
    // Check if this lecture is already a prerequisite
    const existingIndex = selectedPrerequisites.findIndex(p => p.id === lectureId);

    if (existingIndex >= 0) {
      // Remove it if it exists
      const newPrerequisites = [...selectedPrerequisites];
      newPrerequisites.splice(existingIndex, 1);
      onChange(newPrerequisites);
    } else {
      // Add it with default values if it doesn't exist
      const newPrerequisite: Prerequisite = {
        id: lectureId,
        isRequired: true,
        importanceLevel: 3
      };
      onChange([...selectedPrerequisites, newPrerequisite]);
    }
  };

  // Handle changing a prerequisite's required status
  const handleRequiredChange = (index: number, isRequired: boolean) => {
    const newPrerequisites = [...selectedPrerequisites];
    newPrerequisites[index].isRequired = isRequired;
    onChange(newPrerequisites);
  };

  // Handle changing a prerequisite's importance level
  const handleImportanceChange = (index: number, importance: number) => {
    const newPrerequisites = [...selectedPrerequisites];
    newPrerequisites[index].importanceLevel = importance;
    onChange(newPrerequisites);
  };

  // Check if a lecture is selected as a prerequisite
  const isPrerequisite = (lectureId: string) => {
    return selectedPrerequisites.some(p => p.id === lectureId);
  };

  // Group lectures by category for better organization
  const getLecturesByCategory = () => {
    const categories: Record<string, Lecture[]> = {};

    availableLectures.forEach(lecture => {
      if (!categories[lecture.category]) {
        categories[lecture.category] = [];
      }
      categories[lecture.category].push(lecture);
    });

    // Sort lectures by order within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.order - b.order);
    });

    return categories;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
        <p>Error loading lectures: {error}</p>
      </div>
    );
  }

  const categorizedLectures = getLecturesByCategory();

  return (
    <div className="space-y-6">
      {/* Available lectures for selection */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Available Lectures</h4>

        {Object.keys(categorizedLectures).length === 0 ? (
          <p className="text-gray-500 italic">No other lectures available to select as prerequisites.</p>
        ) : (
          Object.entries(categorizedLectures).map(([category, lectures]) => (
            <div key={category} className="mb-4">
              <h5 className="text-sm font-medium text-gray-600 mb-2">{category}</h5>
              <div className="space-y-2">
                {lectures.map(lecture => (
                  <div key={lecture.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`lecture-${lecture.id}`}
                      checked={isPrerequisite(lecture.id)}
                      onChange={() => handlePrerequisiteToggle(lecture.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`lecture-${lecture.id}`}
                      className="ml-2 block text-sm text-gray-700"
                    >
                      {lecture.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected prerequisites configuration */}
      {selectedPrerequisites.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Configure Prerequisites</h4>
          <div className="border rounded-md divide-y">
            {selectedPrerequisites.map((prerequisite, index) => (
              <div key={prerequisite.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">
                    {lectureMap[prerequisite.id]?.title || 'Unknown Lecture'}
                  </h5>
                  <button
                    type="button"
                    onClick={() => handlePrerequisiteToggle(prerequisite.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Required toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${prerequisite.id}`}
                      checked={prerequisite.isRequired}
                      onChange={(e) => handleRequiredChange(index, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`required-${prerequisite.id}`}
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Required Prerequisite
                    </label>
                  </div>

                  {/* Importance level */}
                  <div>
                    <label
                      htmlFor={`importance-${prerequisite.id}`}
                      className="block text-sm text-gray-700 mb-1"
                    >
                      Importance (1-5)
                    </label>
                    <select
                      id={`importance-${prerequisite.id}`}
                      value={prerequisite.importanceLevel}
                      onChange={(e) => handleImportanceChange(index, parseInt(e.target.value))}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrerequisiteSelect;
