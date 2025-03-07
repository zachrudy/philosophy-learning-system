'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

// Define the entity type from our models
type PhilosophicalEntity = {
  id: string;
  type: string;
  name: string;
  description: string;
  startYear?: number | null;
  endYear?: number | null;
  birthplace?: string | null;
  nationality?: string | null;
  biography?: string | null;
  primaryText?: string | null;
  keyTerms?: string[] | null;
  centralQuestion?: string | null;
  stillRelevant?: boolean;
  scope?: string | null;
  geographicalFocus?: string | null;
  historicalContext?: string | null;
  createdAt: string;
  updatedAt: string;
  relationships?: Array<{
    id: string;
    direction: 'incoming' | 'outgoing';
    relationTypes: string[];
    description?: string;
    relatedEntity: {
      id: string;
      name: string;
      type: string;
    };
  }>;
};

interface EntityDetailProps {
  entityId: string;
}

const EntityDetail: React.FC<EntityDetailProps> = ({ entityId }) => {
  const router = useRouter();
  const [entity, setEntity] = useState<PhilosophicalEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Function to refresh entity data
  const refreshEntityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/philosophical-entities/${entityId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch entity');
      }

      const data = await response.json();

      // Sort relationships if they exist
      if (data && data.relationships && Array.isArray(data.relationships)) {
        data.relationships = sortRelationships(data.relationships);
      }

      setEntity(data);
    } catch (err) {
      console.error('Error fetching entity:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to sort relationships by direction and type
  const sortRelationships = (relationships: any[] = []) => {
    if (!relationships || relationships.length === 0) return [];

    // First sort by direction (outgoing first, then incoming)
    // Then sort by relation type alphabetically
    return [...relationships].sort((a, b) => {
      // First sort by direction
      if (a.direction !== b.direction) {
        return a.direction === 'outgoing' ? -1 : 1;
      }

      // Then sort by related entity name
      return a.relatedEntity.name.localeCompare(b.relatedEntity.name);
    });
  };

  // Handle entity deletion
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/philosophical-entities/${entityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entity');
      }

      // Redirect to the entity list
      router.push('/admin/philosophical-entities');
    } catch (err) {
      console.error('Error deleting entity:', err);
      alert(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fetch entity data
  useEffect(() => {
    refreshEntityData();
  }, [entityId]);

  // If loading, show a loading spinner
  if (loading && !entity) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          role="status"
          aria-live="polite"
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // If entity not found, show message
  if (!entity && !loading) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Entity not found</p>
            <Link
              href="/admin/philosophical-entities"
              className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
            >
              Return to entity list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If error occurred, show error message
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={refreshEntityData}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show a loading overlay if refreshing data
  const loadingOverlay = loading && entity ? (
    <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : null;

  return (
    <div className="px-4 py-5 sm:p-6 relative">
      {/* Loading overlay */}
      {loadingOverlay}

      {/* Entity header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 mr-3">{entity.name}</h1>
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {entity.type}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Created: {formatDate(entity.createdAt)} | Last updated: {formatDate(entity.updatedAt)}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshEntityData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Refresh data"
          >
            <svg
              className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <Link
            href={`/admin/philosophical-entities/${entityId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={handleDelete}
            data-testid="entity-delete-button"
            disabled={deleteLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              deleteLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {deleteLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Entity details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Entity Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and properties of this philosophical entity.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.name}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.type}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.description}</dd>
            </div>

            {/* Show dates if provided */}
            {(entity.startYear || entity.endYear) && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  {entity.type === 'Philosopher' ? 'Lifespan' : 'Time Period'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {entity.startYear ? entity.startYear : ''}
                  {entity.startYear && entity.endYear && ' - '}
                  {entity.endYear ? entity.endYear : ''}
                </dd>
              </div>
            )}

            {/* Type-specific fields */}
            {entity.type === 'Philosopher' && (
              <>
                {entity.birthplace && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Birthplace</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.birthplace}</dd>
                  </div>
                )}
                {entity.nationality && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.nationality}</dd>
                  </div>
                )}
                {entity.biography && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Biography</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">{entity.biography}</dd>
                  </div>
                )}
              </>
            )}

            {entity.type === 'PhilosophicalConcept' && (
              <>
                {entity.primaryText && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Primary Text</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.primaryText}</dd>
                  </div>
                )}
                {entity.keyTerms && entity.keyTerms.length > 0 && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Key Terms</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {entity.keyTerms.map((term, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </>
            )}

            {entity.type === 'Problematic' && (
              <>
                {entity.centralQuestion && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Central Question</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.centralQuestion}</dd>
                  </div>
                )}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Still Relevant</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {entity.stillRelevant !== false ? 'Yes' : 'No'}
                  </dd>
                </div>
              </>
            )}

            {entity.type === 'Branch' && entity.scope && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Scope</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">{entity.scope}</dd>
              </div>
            )}

            {entity.type === 'Movement' && (
              <>
                {entity.geographicalFocus && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Geographical Focus</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.geographicalFocus}</dd>
                  </div>
                )}
                {entity.historicalContext && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Historical Context</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">{entity.historicalContext}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Relationships */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Relationships</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Connections with other philosophical entities.
            </p>
          </div>
          <Link
            href={`/admin/philosophical-entities/${entityId}/relationships/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Relationship
          </Link>
        </div>

        {(!entity.relationships || entity.relationships.length === 0) ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">No relationships defined.</p>
            <p className="text-sm text-gray-500 mt-1">
              Add relationships to connect this entity with others in the philosophical knowledge graph.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related Entity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relation Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entity.relationships.map((relationship) => (
                  <tr key={relationship.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {relationship.direction === 'outgoing' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Outgoing
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Incoming
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link
                              href={`/admin/philosophical-entities/${relationship.relatedEntity.id}`}
                              className="hover:underline text-blue-600"
                            >
                              {relationship.relatedEntity.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {relationship.relatedEntity.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {relationship.relationTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {relationship.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/philosophical-relationships/${relationship.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this relationship?')) {
                            try {
                              const response = await fetch(`/api/philosophical-relationships/${relationship.id}`, {
                                method: 'DELETE',
                              });

                              if (!response.ok) {
                                throw new Error('Failed to delete relationship');
                              }

                              // Refresh the entity data to update the relationships list
                              refreshEntityData();

                              // Show a temporary success message that fades away
                              const successElement = document.createElement('div');
                              successElement.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity';
                              successElement.textContent = 'Relationship deleted successfully';
                              document.body.appendChild(successElement);

                              // Remove the success message after 3 seconds
                              setTimeout(() => {
                                successElement.style.opacity = '0';
                                setTimeout(() => {
                                  document.body.removeChild(successElement);
                                }, 500);
                              }, 3000);
                            } catch (err) {
                              console.error('Error deleting relationship:', err);
                              alert(err instanceof Error ? err.message : 'An error occurred while deleting');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityDetail;
