import React from 'react';
import Link from 'next/link';
import { Concept } from '@/types/models';

interface ConceptCardProps {
  concept: Concept;
  isPrerequisite?: boolean;
}

const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  isPrerequisite = false
}) => {
  return (
    <div className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
      isPrerequisite ? 'bg-blue-50 border border-blue-200' : 'bg-white'
    }`}>
      <h3 className="text-xl font-semibold mb-2">{concept.name}</h3>
      <p className="text-gray-600 mb-4">{concept.description}</p>

      <div className="flex justify-between items-center">
        <Link
          href={`/student/concepts/${concept.id}`}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Explore concept
        </Link>

        {isPrerequisite && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Prerequisite
          </span>
        )}
      </div>
    </div>
  );
};

export default ConceptCard;
