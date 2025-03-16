'use client';

import React, { useState, useEffect } from 'react';
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { EntityRelationshipService } from '@/lib/services/entityRelationshipService';
import { validateRelationType } from '@/lib/validation/entityRelationshipValidation';

// Define the philosophical entity type
interface PhilosophicalEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
}

// Define the entity relationship type
interface EntityRelationship {
  entityId: string;
  relationType: string;
}

interface EntityRelationshipSelectProps {
  lectureId?: string; // Current lecture ID (optional, for edit mode)
  initialRelationships?: EntityRelationship[]; // Initially selected relationships
  onChange: (relationships: EntityRelationship[]) => void; // Callback when selection changes
}

const EntityRelationshipSelect: React.FC<EntityRelationshipSelectProps> = ({
  lectureId,
  initialRelationships = [],
  onChange
}) => {
  // State for all available entities
  const [entities, setEntities] = useState<PhilosophicalEntity[]>([]);
  // Selected relationships (entityId, relationType)
  const [relationships, setRelationships] = useState<EntityRelationship[]>(initialRelationships);
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for entity type filtering
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  // Map of entity IDs to their full data for easy lookup
  const [entityMap, setEntityMap] = useState<Record<string, PhilosophicalEntity>>({});

  // Load all philosophical entities
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/philosophical-entities?limit=100');

        if (!response.ok) {
          throw new Error('Failed to fetch philosophical entities');
        }

        const data = await response.json();
        const fetchedEntities = data.data || [];
        setEntities(fetchedEntities);

        // Create a map for easy entity lookup
        const entityMapping: Record<string, PhilosophicalEntity> = {};
        fetchedEntities.forEach((entity: PhilosophicalEntity) => {
          entityMapping[entity.id] = entity;
        });
        setEntityMap(entityMapping);

        // Initialize expanded state for each entity type
        const typesMap: Record<string, boolean> = {};
        fetchedEntities.forEach((entity: PhilosophicalEntity) => {
          if (!typesMap[entity.type]) {
            typesMap[entity.type] = true; // Start with all types expanded
          }
        });
        setExpandedTypes(typesMap);
      } catch (err) {
        console.error('Error fetching entities:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // If we have a lectureId, also fetch existing relationships
    const fetchRelationships = async () => {
      if (!lectureId) return;

      try {
        const existingRelationships = await EntityRelationshipService.getRelationshipsForLecture(lectureId);

        setRelationships(existingRelationships);
        // Call onChange to sync with parent component
        onChange(existingRelationships);
      } catch (err) {
        console.error('Error fetching relationships:', err);
        // Don't set error state to avoid blocking entity loading
      }
    };

    fetchEntities();
    fetchRelationships();
  }, [lectureId, onChange]);

  // Group entities by type
  const getEntitiesByType = () => {
    const groupedEntities: Record<string, PhilosophicalEntity[]> = {};

    entities.forEach(entity => {
      if (!groupedEntities[entity.type]) {
        groupedEntities[entity.type] = [];
      }
      groupedEntities[entity.type].push(entity);
    });

    // Sort entities by name within each type
    Object.keys(groupedEntities).forEach(type => {
      groupedEntities[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groupedEntities;
  };

  // Toggle selection of an entity
  const toggleEntitySelection = (entityId: string) => {
    const isSelected = relationships.some(rel => rel.entityId === entityId);

    if (isSelected) {
      // Remove all relationships with this entity
      const updatedRelationships = relationships.filter(rel => rel.entityId !== entityId);
      setRelationships(updatedRelationships);
      onChange(updatedRelationships);
    } else {
      // Add a default relationship
      const defaultRelationType = Object.values(LECTURE_ENTITY_RELATION_TYPES)[0];
      const newRelationship = { entityId, relationType: defaultRelationType };
      const updatedRelationships = [...relationships, newRelationship];
      setRelationships(updatedRelationships);
      onChange(updatedRelationships);
    }
  };

  // Update the relationship type
  const updateRelationshipType = (entityId: string, relationType: string) => {
    // Validate the relation type
    if (!validateRelationType(relationType)) {
      console.error(`Invalid relation type: ${relationType}`);
      return;
    }

    // Check if this entity-relationType combination already exists
    const existingIndex = relationships.findIndex(
      rel => rel.entityId === entityId && rel.relationType === relationType
    );

    if (existingIndex >= 0) {
      // If it exists, remove it (toggle behavior)
      const updatedRelationships = [...relationships];
      updatedRelationships.splice(existingIndex, 1);

      // If this was the only relationship for this entity, remove the entity completely
      if (!updatedRelationships.some(rel => rel.entityId === entityId)) {
        setRelationships(updatedRelationships);
        onChange(updatedRelationships);
        return;
      }

      setRelationships(updatedRelationships);
      onChange(updatedRelationships);
    } else {
      // Add this relationship
      const newRelationship = { entityId, relationType };
      const updatedRelationships = [...relationships, newRelationship];
      setRelationships(updatedRelationships);
      onChange(updatedRelationships);
    }
  };

  // Toggle expansion of an entity type
  const toggleTypeExpansion = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Check if an entity is selected
  const isEntitySelected = (entityId: string) => {
    return relationships.some(rel => rel.entityId === entityId);
  };

  // Check if a specific relationship type is selected for an entity
  const isRelationshipSelected = (entityId: string, relationType: string) => {
    return relationships.some(
      rel => rel.entityId === entityId && rel.relationType === relationType
    );
  };

  // Get all relationship types for an entity
  const getRelationshipTypesForEntity = (entityId: string) => {
    return relationships
      .filter(rel => rel.entityId === entityId)
      .map(rel => rel.relationType);
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
        <p>Error loading entities: {error}</p>
      </div>
    );
  }

  const groupedEntities = getEntitiesByType();

  return (
    <div className="space-y-6">
      {/* Entity Selection Section */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Available Philosophical Entities</h4>

        {Object.keys(groupedEntities).length === 0 ? (
          <p className="text-gray-500 italic">No philosophical entities available.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEntities).map(([type, typeEntities]) => (
              <div key={type} className="border rounded-md overflow-hidden">
                {/* Type header with expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleTypeExpansion(type)}
                  className="w-full flex justify-between items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                >
                  <span className="font-medium text-gray-700">{type} ({typeEntities.length})</span>
                  <svg
                    className={`h-5 w-5 text-gray-500 transform ${expandedTypes[type] ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Entities list, shown only if expanded */}
                {expandedTypes[type] && (
                  <div className="p-4 divide-y">
                    {typeEntities.map(entity => (
                      <div key={entity.id} className="py-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`entity-${entity.id}`}
                            checked={isEntitySelected(entity.id)}
                            onChange={() => toggleEntitySelection(entity.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`entity-${entity.id}`}
                            className="ml-2 block text-sm font-medium text-gray-700"
                          >
                            {entity.name}
                          </label>
                        </div>

                        {/* Show relationship type selection if entity is selected */}
                        {isEntitySelected(entity.id) && (
                          <div className="ml-6 mt-2">
                            <p className="text-xs text-gray-500 mb-1">Relationship types:</p>
                            <div className="flex flex-wrap gap-2">
                              {EntityRelationshipService.getRelationTypes().map(({ key, value, display }) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => updateRelationshipType(entity.id, value)}
                                  className={`px-2 py-1 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    isRelationshipSelected(entity.id, value)
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {display}
                                  {isRelationshipSelected(entity.id, value) && (
                                    <span className="ml-1">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Relationships Summary */}
      {relationships.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Selected Relationships</h4>
          <div className="border rounded-md divide-y">
            {relationships.map((relationship, index) => {
              const entity = entityMap[relationship.entityId];
              if (!entity) return null;

              return (
                <div key={`${relationship.entityId}-${relationship.relationType}`} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entity.name}</p>
                      <p className="text-xs text-gray-500">{entity.type}</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {EntityRelationshipService.getRelationTypeDisplayName(relationship.relationType)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateRelationshipType(entity.id, relationship.relationType)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reverse Relationships Section (future enhancement) */}
      {/* This would show where entities are referenced in other lectures */}
    </div>
  );
};

export default EntityRelationshipSelect;
