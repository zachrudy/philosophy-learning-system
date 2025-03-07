'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RELATION_TYPES } from '@/lib/constants';

// Define types
export type Entity = {
  id: string;
  name: string;
  type: string;
};

export type Relationship = {
  id?: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationTypes: string[];
  description?: string;
  importance?: number;
};

export interface RelationshipFormProps {
  relationshipId?: string; // If provided, editing an existing relationship
  sourceEntityId?: string; // If provided, pre-select source entity
  initialData?: Partial<Relationship>; // Initial data for editing
  // Added for better testability
  fetchEntities?: () => Promise<Entity[]>;
  fetchRelationship?: (id: string) => Promise<Relationship>;
  createRelationship?: (data: Relationship) => Promise<Relationship>;
  updateRelationship?: (id: string, data: Partial<Relationship>) => Promise<Relationship>;
}

// Pure validation functions for better testability
export const validateRequired = (value: any): boolean => {
  return value !== undefined && value !== null && value !== '';
};

export const validateRelationshipForm = (data: Partial<Relationship>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validateRequired(data.sourceEntityId)) {
    errors.push('Source entity is required');
  }

  if (!validateRequired(data.targetEntityId)) {
    errors.push('Target entity is required');
  }

  if (data.sourceEntityId === data.targetEntityId && validateRequired(data.sourceEntityId)) {
    errors.push('Source and target entities must be different');
  }

  if (!data.relationTypes?.length) {
    errors.push('Please select at least one relation type');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const RelationshipForm: React.FC<RelationshipFormProps> = ({
  relationshipId,
  sourceEntityId,
  initialData,
  // Default implementations for data fetching and mutation
  fetchEntities = async () => {

    const response = await fetch('/api/philosophical-entities');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load entities');
    }
    const data = await response.json();
    return data.data || [];
  },
  fetchRelationship = async (id: string) => {
    const response = await fetch(`/api/philosophical-relationships/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch relationship');
    }
    return response.json();
  },
  createRelationship = async (data: Relationship) => {
    const response = await fetch('/api/philosophical-relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An error occurred');
    }

    return response.json();
  },
  updateRelationship = async (id: string, data: Partial<Relationship>) => {
    const response = await fetch(`/api/philosophical-relationships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An error occurred');
    }

    return response.json();
  }
}) => {
  const memoizedFetchEntities = useCallback(fetchEntities, []);
  const memoizedFetchRelationship = useCallback(
    (id: string) => fetchRelationship(id),
    []
  );
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Relationship>>({
    sourceEntityId: sourceEntityId || '',
    targetEntityId: '',
    relationTypes: [],
    description: '',
    importance: 3,
    ...initialData
  });

  const isEditMode = !!relationshipId;

  // Load entities for the select dropdowns
  useEffect(() => {
    let isActive = true;

    const loadEntities = async () => {
      try {
        setEntitiesLoading(true);

        const entitiesData = await memoizedFetchEntities();

        if (isActive) {
          setEntities(entitiesData);
        }
      } catch (err) {
        console.error('Error fetching entities:', err);
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load entities');
        }
      } finally {
        if (isActive) {
          setEntitiesLoading(false);
        }
      }
    };

    loadEntities();

    return () => {
      isActive = false;
    };
  }, [memoizedFetchEntities]); // Using memoized function prevents recreation


  // Load relationship data in edit mode
  useEffect(() => {
    if (!isEditMode || initialData) return;

    let isActive = true;

    const loadRelationship = async () => {
      try {
        setLoading(true);

        const data = await memoizedFetchRelationship(relationshipId);

        if (isActive) {
          setFormData(data);
        }
      } catch (err) {
        console.error('Error fetching relationship:', err);
        if (isActive) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadRelationship();

    return () => {
      isActive = false;
    };
  }, [isEditMode, initialData, relationshipId, memoizedFetchRelationship]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation errors when the user corrects input
    setValidationErrors([]);
  };

  // Handle relation types selection
  const handleRelationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, relationTypes: selectedOptions }));
    setValidationErrors([]);
  };

  // Handle importance change
  const handleImportanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setFormData(prev => ({ ...prev, importance: value }));
  };

  // Process and submit the form
  const validateForm = () => {
    // This function directly updates validation state and returns validity
    const { valid, errors } = validateRelationshipForm(formData);
    setValidationErrors(errors);
    return valid;
  };

  // Process and submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run validation and return early if invalid
    if (!validateForm()) {
      return;
    }

    // Continue with form submission
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFormSubmitted(true);

    try {
      let result;

      if (isEditMode) {
        result = await updateRelationship(relationshipId, formData);
        setSuccess('Relationship updated successfully');
      } else {
        result = await createRelationship(formData as Relationship);
        setSuccess('Relationship created successfully');
      }

      // Redirect after short delay - using window.location for hard navigation
      // This helps prevent issues with router.push
      setTimeout(() => {
        window.location.href = `/admin/philosophical-entities/${formData.sourceEntityId}`;
      }, 1500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  // Filter entities for target selection
  const getTargetEntityOptions = () => {
    return entities.filter(entity => entity.id !== formData.sourceEntityId);
  };

  // If loading entities, show a loading spinner
  if (entitiesLoading && entities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading entities">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEditMode ? 'Edit Relationship' : 'Create New Relationship'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Update the details of this philosophical relationship.'
              : 'Define a relationship between two philosophical entities.'}
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert" aria-live="assertive">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4" role="alert" aria-live="polite" data-testid="validation-errors">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Please correct the following issues:</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {validationErrors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            aria-label={isEditMode ? "Edit Relationship Form" : "Create Relationship Form"}
            data-testid="relationship-form"
          >
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* Source Entity */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="sourceEntityId" className="block text-sm font-medium text-gray-700">
                      Source Entity
                    </label>
                    <select
                      id="sourceEntityId"
                      name="sourceEntityId"
                      data-testid="source-entity-select"
                      value={formData.sourceEntityId || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!!sourceEntityId || isEditMode} // Disable if pre-selected or editing
                      aria-invalid={validationErrors.some(err => err.includes('Source entity'))}
                      aria-describedby={validationErrors.some(err => err.includes('Source entity')) ? "source-entity-error" : undefined}
                    >
                      <option value="">Select Source Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.type})
                        </option>
                      ))}
                    </select>
                    {validationErrors.some(err => err.includes('Source entity')) && (
                      <p id="source-entity-error" className="mt-1 text-sm text-red-600">
                        Source entity is required
                      </p>
                    )}
                  </div>

                  {/* Target Entity */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="targetEntityId" className="block text-sm font-medium text-gray-700">
                      Target Entity
                    </label>
                    <select
                      id="targetEntityId"
                      name="targetEntityId"
                      data-testid="target-entity-select"
                      value={formData.targetEntityId || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isEditMode} // Disable if editing
                      aria-invalid={validationErrors.some(err => err.includes('Target entity') || err.includes('different'))}
                      aria-describedby={validationErrors.some(err => err.includes('Target entity') || err.includes('different')) ? "target-entity-error" : undefined}
                    >
                      <option value="">Select Target Entity</option>
                      {getTargetEntityOptions().map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.type})
                        </option>
                      ))}
                    </select>
                    {validationErrors.some(err => err.includes('Target entity') || err.includes('different')) && (
                      <p id="target-entity-error" className="mt-1 text-sm text-red-600">
                        {validationErrors.find(err => err.includes('Target entity') || err.includes('different'))}
                      </p>
                    )}
                  </div>

                  {/* Relation Types */}
                  <div className="col-span-6">
                    <label htmlFor="relationTypes" className="block text-sm font-medium text-gray-700">
                      Relation Types
                    </label>
                    <select
                      id="relationTypes"
                      name="relationTypes"
                      data-testid="relation-types-select"
                      multiple
                      value={formData.relationTypes || []}
                      onChange={handleRelationTypeChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      size={5}
                      aria-invalid={validationErrors.some(err => err.includes('relation type'))}
                      aria-describedby={validationErrors.some(err => err.includes('relation type')) ? "relation-type-error" : undefined}
                    >
                      {Object.entries(RELATION_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {key.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    {validationErrors.some(err => err.includes('relation type')) && (
                      <p id="relation-type-error" className="mt-1 text-sm text-red-600">
                        Please select at least one relation type
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl (or Cmd on Mac) to select multiple relation types.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      data-testid="description-input"
                      rows={3}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe the nature of this relationship (optional)"
                    />
                  </div>

                  {/* Importance */}
                  <div className="col-span-6">
                    <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                      Importance (1-5)
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="range"
                        id="importance"
                        name="importance"
                        data-testid="importance-slider"
                        min="1"
                        max="5"
                        step="1"
                        value={formData.importance || 3}
                        onChange={handleImportanceChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        aria-valuemin={1}
                        aria-valuemax={5}
                        aria-valuenow={formData.importance || 3}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {formData.importance || 3}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      1 = Minor connection, 5 = Critical relationship
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Link
                  href={`/admin/philosophical-entities/${sourceEntityId || ''}`}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  aria-label="Cancel and return to entity page"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="submit-button"
                  onClick={() => validateForm()} // Add immediate validation on click
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  aria-disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{isEditMode ? 'Update Relationship' : 'Create Relationship'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RelationshipForm;
