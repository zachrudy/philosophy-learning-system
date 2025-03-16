'use client';

import React from 'react';
import Link from 'next/link';
import { EntityRelationshipService } from '@/lib/services/entityRelationshipService';

interface EntityWithRelations {
  id: string;
  name: string;
  type: string;
  relations: {
    relationType: string;
  }[];
}

interface EntityRelationshipDisplayProps {
  entities: EntityWithRelations[];
  showTitle?: boolean;
  compact?: boolean;
  linkToEntities?: boolean;
}

/**
 * Component to display entity relationships
 * Can be used in various places where we need to show related entities
 */
const EntityRelationshipDisplay: React.FC<EntityRelationshipDisplayProps> = ({
  entities,
  showTitle = true,
  compact = false,
  linkToEntities = true
}) => {
  if (!entities || entities.length === 0) {
    return (
      <div className="text-gray-500 italic">
        No related philosophical entities.
      </div>
    );
  }

  // Group entities by type
  const groupedEntities: Record<string, EntityWithRelations[]> = {};

  entities.forEach(entity => {
    if (!groupedEntities[entity.type]) {
      groupedEntities[entity.type] = [];
    }
    groupedEntities[entity.type].push(entity);
  });

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-medium text-gray-900">Related Philosophical Entities</h3>
      )}

      {Object.entries(groupedEntities).map(([type, typeEntities]) => (
        <div key={type} className="space-y-2">
          <h4 className="text-md font-medium text-gray-700">{type}</h4>

          {compact ? (
            // Compact view - show entities as a list of badges
            <div className="flex flex-wrap gap-2">
              {typeEntities.map(entity => (
                <div
                  key={entity.id}
                  className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-800"
                >
                  {linkToEntities ? (
                    <Link
                      href={`/admin/philosophical-entities/${entity.id}`}
                      className="hover:underline"
                    >
                      {entity.name}
                    </Link>
                  ) : (
                    <span>{entity.name}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Detailed view - show each entity with its relation types
            <div className="space-y-2">
              {typeEntities.map(entity => (
                <div
                  key={entity.id}
                  className="border rounded-md p-3 bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-sm font-medium text-gray-800">
                        {linkToEntities ? (
                          <Link
                            href={`/admin/philosophical-entities/${entity.id}`}
                            className="hover:text-blue-600"
                          >
                            {entity.name}
                          </Link>
                        ) : (
                          entity.name
                        )}
                      </h5>

                      {entity.relations && entity.relations.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entity.relations.map((relation, index) => (
                            <span
                              key={`${entity.id}-${relation.relationType}-${index}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {EntityRelationshipService.getRelationTypeDisplayName(relation.relationType)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EntityRelationshipDisplay;
