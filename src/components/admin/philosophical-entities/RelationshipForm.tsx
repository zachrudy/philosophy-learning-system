'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RELATION_TYPES } from '@/lib/constants';

// Define types
type Entity = {
  id: string;
  name: string;
  type: string;
};

type Relationship = {
  id?: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationTypes: string[];
  description?: string;
  importance?: number;
};

interface RelationshipFormProps {
  relationshipId?: string; // If provided, editing an existing relationship
  sourceEntityId?: string; // If provided, pre-select source entity
  initialData?: Partial<Relationship>; // Initial data for editing
}

const RelationshipForm: React.FC<RelationshipFormProps> = ({
  relationshipId,
  sourceEntityId,
  initialData
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

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

  // Fetch entities for the select dropdowns
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setEntitiesLoading(true);

        // Fetch all entities for the dropdowns
        const response = await fetch('/api/philosophical-entities');

        if (!response.ok) {
          throw new Error('Failed to fetch entities');
        }

        const data = await response.json();
        setEntities(data.data || []);
      } catch (err) {
        console.error('Error fetching entities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load entities');
      } finally {
        setEntitiesLoading(false);
      }
    };

    fetchEntities();
  }, []);

  // Fetch relationship data in edit mode
  useEffect(() => {
    if (isEditMode && !initialData) {
      const fetchRelationship = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/philosophical-relationships/${relationshipId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch relationship');
          }

          const data = await response.json();
          setFormData(data);
        } catch (err) {
          console.error('Error fetching relationship:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchRelationship();
    }
  }, [relationshipId, initialData, isEditMode]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle relation types selection
  const handleRelationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, relationTypes: selectedOptions }));
  };

  // Handle importance change
  const handleImportanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setFormData(prev => ({ ...prev, importance: value }));
  };

  // Process and submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFormSubmitted(true);

    // Validate source and target are different
    if (formData.sourceEntityId === formData.targetEntityId) {
      setError('Source and target entities must be different');
      setLoading(false);
      return;
    }

    // Validate at least one relation type is selected
    if (!formData.relationTypes?.length) {
      setError('Please select at least one relation type');
      setLoading(false);
      return;
    }

    try {
      // Determine if this is a create or update operation
      const method = isEditMode ? 'PATCH' : 'POST';
      const url = isEditMode
        ? `/api/philosophical-relationships/${relationshipId}`
        : '/api/philosophical-relationships';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const result = await response.json();

      setSuccess(isEditMode
        ? 'Relationship updated successfully'
        : 'Relationship created successfully'
      );

      // Redirect after short delay
      setTimeout(() => {
        // Redirect to the source entity detail page
        router.push(`/admin/philosophical-entities/${formData.sourceEntityId}`);
      }, 1500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  // If loading entities, show a loading spinner
  if (entitiesLoading && entities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
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
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
                      value={formData.sourceEntityId || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!!sourceEntityId || isEditMode} // Disable if pre-selected or editing
                    >
                      <option value="">Select Source Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Entity */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="targetEntityId" className="block text-sm font-medium text-gray-700">
                      Target Entity
                    </label>
                    <select
                      id="targetEntityId"
                      name="targetEntityId"
                      value={formData.targetEntityId || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isEditMode} // Disable if editing
                    >
                      <option value="">Select Target Entity</option>
                      {entities
                        .filter(entity => entity.id !== formData.sourceEntityId) // Filter out source entity
                        .map(entity => (
                          <option key={entity.id} value={entity.id}>
                            {entity.name} ({entity.type})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Relation Types */}
                  <div className="col-span-6">
                    <label htmlFor="relationTypes" className="block text-sm font-medium text-gray-700">
                      Relation Types
                    </label>
                    <select
                      id="relationTypes"
                      name="relationTypes"
                      multiple
                      value={formData.relationTypes || []}
                      onChange={handleRelationTypeChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      size={5}
                    >
                      {Object.entries(RELATION_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {key.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
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
                        min="1"
                        max="5"
                        step="1"
                        value={formData.importance || 3}
                        onChange={handleImportanceChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Relationship' : 'Create Relationship'}</>
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
