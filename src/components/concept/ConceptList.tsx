import React, { useState, useEffect } from 'react';
import ConceptCard from './ConceptCard';
import { Concept } from '@/types/models';

interface ConceptListProps {
  title?: string;
  conceptIds?: string[];
  showAsPrerequisites?: boolean;
}

const ConceptList: React.FC<ConceptListProps> = ({
  title = 'Concepts',
  conceptIds,
  showAsPrerequisites = false,
}) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        setLoading(true);

        let url = '/api/concepts';
        // If specific concept IDs are provided, use them to filter
        if (conceptIds && conceptIds.length > 0) {
          const query = new URLSearchParams();
          conceptIds.forEach(id => query.append('ids', id));
          url += `?${query.toString()}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch concepts');
        }

        const data = await response.json();
        setConcepts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
  }, [conceptIds]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-600">
        <p>Error loading concepts: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-md">
        <p className="text-gray-500">No concepts available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            isPrerequisite={showAsPrerequisites}
          />
        ))}
      </div>
    </div>
  );
};

export default ConceptList;
