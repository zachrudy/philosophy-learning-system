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
  // Track which entities have their relationship panel open
  const [openRelationPanels, setOpenRelationPanels] = useState<Record<string, boolean>>({});
  // Relation types from service
  const relationTypes = EntityRelationshipService.getRelationTypes();

  // Load all philosophical entities
    useEffect(() => {
      let isActive = true; // Flag to prevent state updates if component unmounts

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

          // Only update state if component is still mounted
          if (isActive) {
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
          }
        } catch (err) {
          console.error('Error fetching entities:', err);
          if (isActive) {
            setError(err instanceof Error ? err.message : 'An error occurred');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchEntities();

      // Cleanup function
      return () => {
        isActive = false;
      };
    }, []); // Remove dependencies to prevent re-fetching

    // Handle initial relationships and fetch if needed
    useEffect(() => {
      // If initialRelationships is provided, use it directly
      if (initialRelationships && initialRelationships.length > 0) {
        // Validate the initialRelationships to ensure they have required fields
        const validRelationships = initialRelationships.filter(rel =>
          rel && rel.entityId && rel.relationType &&
          typeof rel.entityId === 'string' &&
          typeof rel.relationType === 'string'
        );

        setRelationships(validRelationships);

        // Open relation panels for entities that already have relationships
        const entityIds = new Set(validRelationships.map(rel => rel.entityId));
        const panelState: Record<string, boolean> = {};
        entityIds.forEach(id => {
          panelState[id] = true;
        });
        setOpenRelationPanels(panelState);

        // No need to fetch or call onChange since we're using initialRelationships
        return;
      }

      // Only fetch from API if we have lectureId AND no initialRelationships were provided
      if (lectureId && initialRelationships.length === 0) {
        let isActive = true;

        const fetchRelationships = async () => {
          try {
            const existingRelationships = await EntityRelationshipService.getRelationshipsForLecture(lectureId);

            if (isActive) {
              setRelationships(existingRelationships);

              // Open relation panels for entities that already have relationships
              const entityIds = new Set(existingRelationships.map(rel => rel.entityId));
              const panelState: Record<string, boolean> = {};
              entityIds.forEach(id => {
                panelState[id] = true;
              });
              setOpenRelationPanels(panelState);

              // Call onChange to sync with parent component
              onChange(existingRelationships);
            }
          } catch (err) {
            console.error('Error fetching relationships:', err);
            // Don't set error state to avoid blocking entity loading
          }
        };

        fetchRelationships();

        return () => {
          isActive = false;
        };
      }
    }, [lectureId, initialRelationships, onChange]);

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
    const isSelected = isEntitySelected(entityId);

    if (isSelected) {
      // Remove all relationships with this entity
      const updatedRelationships = relationships.filter(rel => rel.entityId !== entityId);
      setRelationships(updatedRelationships);
      onChange(updatedRelationships);

      // Close the relation panel
      setOpenRelationPanels(prev => ({
        ...prev,
        [entityId]: false
      }));
    } else {
      // When selecting an entity, add it with at least one default relationship type
      const defaultRelationType = relationTypes[0].value;
      const updatedRelationships = [
        ...relationships,
        { entityId, relationType: defaultRelationType }
      ];

      setRelationships(updatedRelationships);
      onChange(updatedRelationships);

      // Open the relation panel for selection
      setOpenRelationPanels(prev => ({
        ...prev,
        [entityId]: true
      }));
    }
  };

  // Toggle a specific relationship type for an entity
  const toggleRelationshipType = (entityId: string, relationType: string) => {
    // Ensure the relation type is in the correct format from our constants
    const canonicalType = Object.values(LECTURE_ENTITY_RELATION_TYPES).find(
      type => type.toLowerCase() === relationType.toLowerCase()
    ) || LECTURE_ENTITY_RELATION_TYPES.INTRODUCES;

    // Check if this entity-relationType combination already exists (case-insensitive)
    const existingIndex = relationships.findIndex(
      rel => rel.entityId === entityId &&
             rel.relationType.toLowerCase() === canonicalType.toLowerCase()
    );

    let updatedRelationships: EntityRelationship[];

    if (existingIndex >= 0) {
      // If it exists, remove it (toggle behavior)
      updatedRelationships = relationships.filter(
        (_, index) => index !== existingIndex
      );
    } else {
      // Add this relationship with the canonical type from constants
      updatedRelationships = [
        ...relationships,
        { entityId, relationType: canonicalType }
      ];
    }

    setRelationships(updatedRelationships);
    onChange(updatedRelationships);
  };

  // Toggle relation panel for an entity
  const toggleRelationPanel = (entityId: string) => {
    setOpenRelationPanels(prev => ({
      ...prev,
      [entityId]: !prev[entityId]
    }));
  };

  // Toggle expansion of an entity type
  const toggleTypeExpansion = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Check if an entity is selected (has any relationship)
  const isEntitySelected = (entityId: string) => {
    return relationships.some(rel => rel.entityId === entityId);
  };

  // Check if a specific relationship type is selected for an entity
  const isRelationshipSelected = (entityId: string, relationType: string) => {
    return relationships.some(
      rel => rel.entityId === entityId &&
             rel.relationType.toLowerCase() === relationType.toLowerCase()
    );
  };

  // Get all relationship types for an entity
  const getRelationshipTypesForEntity = (entityId: string) => {
    return relationships
      .filter(rel => rel.entityId === entityId)
      .map(rel => rel.relationType);
  };

  // Get a count of relationship types for an entity
  const getRelationshipCountForEntity = (entityId: string) => {
    return relationships.filter(rel => rel.entityId === entityId).length;
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
                  <div className="divide-y">
                    {typeEntities.map(entity => (
                      <div key={entity.id} className="p-4">
                        <div className="flex items-center justify-between">
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

                          {isEntitySelected(entity.id) && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">
                                {getRelationshipCountForEntity(entity.id)} relationship{getRelationshipCountForEntity(entity.id) !== 1 ? 's' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRelationPanel(entity.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {openRelationPanels[entity.id] ? 'Hide' : 'Edit'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Entity description (if available) */}
                        {entity.description && (
                          <p className="mt-1 ml-6 text-xs text-gray-500 line-clamp-2">
                            {entity.description}
                          </p>
                        )}

                        {/* Relationship type selection */}
                        {(isEntitySelected(entity.id) && openRelationPanels[entity.id]) && (
                          <div className="ml-6 mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2 font-medium">
                              Select relationship types:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {relationTypes.map(({ key, value, display }) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => toggleRelationshipType(entity.id, value)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                                    isRelationshipSelected(entity.id, value)
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {display}
                                  {isRelationshipSelected(entity.id, value) && (
                                    <span className="ml-1">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* Helper text for relationship selection */}
                            <p className="mt-2 text-xs text-gray-500">
                              {getRelationshipTypesForEntity(entity.id).length === 0
                                ? 'Please select at least one relationship type above or uncheck this entity.'
                                : 'You can select multiple relationship types for this entity.'}
                            </p>
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
          <h4 className="text-md font-medium text-gray-700 mb-3">Selected Relationships Summary</h4>
          <div className="border rounded-md divide-y">
            {/* Group by entity for the summary */}
            {Object.entries(
              relationships.reduce((acc, relationship) => {
                const { entityId } = relationship;
                if (!acc[entityId]) {
                  acc[entityId] = [];
                }
                acc[entityId].push(relationship);
                return acc;
              }, {} as Record<string, EntityRelationship[]>)
            ).map(([entityId, entityRelationships]) => {
              const entity = entityMap[entityId];
              if (!entity) return null;

              return (
                <div key={entityId} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entity.name}</p>
                      <p className="text-xs text-gray-500">{entity.type}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entityRelationships.map((relationship, index) => (
                          <span
                            key={`${entityId}-${relationship.relationType}-${index}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {EntityRelationshipService.getRelationTypeDisplayName(relationship.relationType)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleRelationPanel(entityId)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEntitySelection(entityId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityRelationshipSelect;
