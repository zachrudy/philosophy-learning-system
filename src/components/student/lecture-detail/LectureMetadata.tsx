// src/components/student/lecture-detail/LectureMetadata.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PhilosophicalEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface LectureEntityRelation {
  entityId: string;
  relationType: string;
  entity: PhilosophicalEntity;
}

interface LectureMetadataProps {
  lecture: {
    id: string;
    title: string;
    description: string;
    category: string;
    lecturerName: string;
    contentType: string;
    order: number;
    sourceAttribution: string;
    embedAllowed: boolean;
    createdAt: string;
    entityRelations?: LectureEntityRelation[];
    entities?: PhilosophicalEntity[];
  };
  className?: string;
}

const LectureMetadata: React.FC<LectureMetadataProps> = ({
  lecture,
  className = ''
}) => {
  const [showAllEntities, setShowAllEntities] = useState(false);

  // Group entities by type
  const entityTypes = lecture.entities
    ? Array.from(new Set(lecture.entities.map(entity => entity.type)))
    : [];

  const entitiesByType = entityTypes.reduce((acc, type) => {
    acc[type] = lecture.entities?.filter(entity => entity.type === type) || [];
    return acc;
  }, {} as Record<string, PhilosophicalEntity[]>);

  // Group entity relations by type
  const relationTypes = lecture.entityRelations
    ? Array.from(new Set(lecture.entityRelations.map(rel => rel.relationType)))
    : [];

  const relationsByType = relationTypes.reduce((acc, type) => {
    acc[type] = lecture.entityRelations?.filter(rel => rel.relationType === type) || [];
    return acc;
  }, {} as Record<string, LectureEntityRelation[]>);

  // Format relation type for display
  const formatRelationType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 bg-blue-50">
        <h3 className="text-lg font-medium leading-6 text-blue-900">Lecture Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-blue-700">
          Additional details about this lecture and related philosophical entities.
        </p>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900">{lecture.category}</dd>
          </div>

          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Lecturer</dt>
            <dd className="mt-1 text-sm text-gray-900">{lecture.lecturerName}</dd>
          </div>

          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Content Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{lecture.contentType}</dd>
          </div>

          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Order in Category</dt>
            <dd className="mt-1 text-sm text-gray-900">{lecture.order + 1}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Source Attribution</dt>
            <dd className="mt-1 text-sm text-gray-900">{lecture.sourceAttribution}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Added on</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(lecture.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Philosophical Entities Section */}
      {lecture.entities && lecture.entities.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Philosophical Entities</h4>

          <div className="space-y-6">
            {entityTypes.map(type => (
              <div key={type}>
                <h5 className="text-sm font-medium text-gray-700 mb-2">{type}s</h5>
                <div className="flex flex-wrap gap-2">
                  {entitiesByType[type]
                    .slice(0, showAllEntities ? undefined : 5)
                    .map(entity => (
                      <Link
                        key={entity.id}
                        href={`/entities/${entity.id}`}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {entity.name}
                      </Link>
                    ))}
                  {!showAllEntities && entitiesByType[type].length > 5 && (
                    <button
                      onClick={() => setShowAllEntities(true)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      +{entitiesByType[type].length - 5} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Relationships Section */}
      {lecture.entityRelations && lecture.entityRelations.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Philosophical Relationships</h4>

          <div className="space-y-6">
            {relationTypes.map(type => (
              <div key={type}>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {formatRelationType(type)}
                </h5>
                <ul className="space-y-2">
                  {relationsByType[type].slice(0, showAllEntities ? undefined : 3).map(relation => (
                    <li
                      key={`${relation.entityId}-${relation.relationType}`}
                      className="text-sm bg-gray-50 p-3 rounded-md"
                    >
                      <Link
                        href={`/entities/${relation.entityId}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {relation.entity.name}
                      </Link>
                      {relation.entity.description && (
                        <p className="mt-1 text-gray-600">
                          {relation.entity.description.length > 120
                            ? `${relation.entity.description.substring(0, 120)}...`
                            : relation.entity.description}
                        </p>
                      )}
                    </li>
                  ))}

                  {!showAllEntities && relationsByType[type].length > 3 && (
                    <li>
                      <button
                        onClick={() => setShowAllEntities(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Show {relationsByType[type].length - 3} more {formatRelationType(type).toLowerCase()} relationships
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAllEntities && (
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50 text-center">
          <button
            onClick={() => setShowAllEntities(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
};

export default LectureMetadata;
