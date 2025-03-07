'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define the entity type from our models
type PhilosophicalEntity = {
  id?: string;
  type: string;
  name: string;
  description: string;
  startYear: null,
  endYear: null,
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
};

// Define props type
interface EntityFormProps {
  entityId?: string; // Optional - if provided, it's edit mode
  initialData?: Partial<PhilosophicalEntity>; // Optional initial data
}

const EntityForm: React.FC<EntityFormProps> = ({ entityId, initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<Partial<PhilosophicalEntity>>({
    type: 'Philosopher',
    name: '',
    description: '',
    ...initialData
  });

  // Handle keyTerms as array
  const [keyTermsInput, setKeyTermsInput] = useState<string>(
    initialData?.keyTerms ? initialData.keyTerms.join(', ') : ''
  );

  const isEditMode = !!entityId;

  // Fetch entity data in edit mode
  useEffect(() => {
    if (isEditMode && !initialData) {
      const fetchEntity = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/philosophical-entities/${entityId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch entity');
          }

          const data = await response.json();
          setFormData(data);

          // Set keyTerms input field
          if (data.keyTerms && Array.isArray(data.keyTerms)) {
            setKeyTermsInput(data.keyTerms.join(', '));
          }
        } catch (err) {
          console.error('Error fetching entity:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchEntity();
    }
  }, [entityId, initialData, isEditMode]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle keyTerms input
  const handleKeyTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyTermsInput(e.target.value);
  };

  // Process and submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFormSubmitted(true);

    try {
      // Process keyTerms from comma-separated string to array
      const keyTerms = keyTermsInput
        ? keyTermsInput.split(',').map(term => term.trim()).filter(term => term)
        : [];

      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        keyTerms: keyTerms.length > 0 ? keyTerms : null,
      };

      // Determine if this is a create or update operation
      const method = isEditMode ? 'PATCH' : 'POST';
      const url = isEditMode
        ? `/api/philosophical-entities/${entityId}`
        : '/api/philosophical-entities';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const result = await response.json();

      setSuccess(isEditMode
        ? 'Entity updated successfully'
        : 'Entity created successfully'
      );

      // Redirect after short delay
      setTimeout(() => {
        if (isEditMode) {
          // Reload the page to show updated data
          router.refresh();
        } else {
          // Redirect to the entity list or the newly created entity
          router.push(`/admin/philosophical-entities/${result.id}`);
        }
      }, 1500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  // Render type-specific fields based on selected entity type
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'Philosopher':
        return (
          <>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="birthplace" className="block text-sm font-medium text-gray-700">
                Birthplace
              </label>
              <input
                type="text"
                name="birthplace"
                id="birthplace"
                value={formData.birthplace || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                id="nationality"
                value={formData.nationality || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-6">
              <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
                Biography
              </label>
              <textarea
                id="biography"
                name="biography"
                rows={3}
                value={formData.biography || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'PhilosophicalConcept':
        return (
          <>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="primaryText" className="block text-sm font-medium text-gray-700">
                Primary Text
              </label>
              <input
                type="text"
                name="primaryText"
                id="primaryText"
                value={formData.primaryText || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="keyTerms" className="block text-sm font-medium text-gray-700">
                Key Terms (comma-separated)
              </label>
              <input
                type="text"
                name="keyTerms"
                id="keyTerms"
                value={keyTermsInput}
                onChange={handleKeyTermsChange}
                placeholder="term1, term2, term3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'Problematic':
        return (
          <>
            <div className="col-span-6">
              <label htmlFor="centralQuestion" className="block text-sm font-medium text-gray-700">
                Central Question
              </label>
              <textarea
                id="centralQuestion"
                name="centralQuestion"
                rows={3}
                value={formData.centralQuestion || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="stillRelevant"
                    name="stillRelevant"
                    type="checkbox"
                    checked={formData.stillRelevant !== false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="stillRelevant" className="font-medium text-gray-700">
                    Still Relevant
                  </label>
                  <p className="text-gray-500">Indicate if this problematic is still relevant in contemporary philosophy.</p>
                </div>
              </div>
            </div>
          </>
        );

      case 'Branch':
        return (
          <div className="col-span-6">
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
              Scope
            </label>
            <textarea
              id="scope"
              name="scope"
              rows={3}
              value={formData.scope || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Define the scope of this philosophical branch..."
            />
          </div>
        );

      case 'Movement':
        return (
          <>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="geographicalFocus" className="block text-sm font-medium text-gray-700">
                Geographical Focus
              </label>
              <input
                type="text"
                name="geographicalFocus"
                id="geographicalFocus"
                value={formData.geographicalFocus || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-6">
              <label htmlFor="historicalContext" className="block text-sm font-medium text-gray-700">
                Historical Context
              </label>
              <textarea
                id="historicalContext"
                name="historicalContext"
                rows={3}
                value={formData.historicalContext || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // If loading and no initial data, show loading spinner
  if (loading && !formSubmitted && !formData.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }


  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEditMode ? 'Edit Philosophical Entity' : 'Create New Philosophical Entity'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Update the details of this philosophical entity.'
              : 'Complete the form to add a new philosophical entity to the knowledge base.'}
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
                  {/* Entity Type */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Entity Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type || 'Philosopher'}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Philosopher">Philosopher</option>
                      <option value="PhilosophicalConcept">Philosophical Concept</option>
                      <option value="Branch">Branch of Philosophy</option>
                      <option value="Movement">Philosophical Movement</option>
                      <option value="Problematic">Philosophical Problematic</option>
                      <option value="Era">Historical Era</option>
                    </select>
                  </div>

                  {/* Entity Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Start Year */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="startYear" className="block text-sm font-medium text-gray-700">
                      Start Year
                    </label>
                    <input
                      type="number"
                      name="startYear"
                      id="startYear"
                      value={formData.startYear || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="9999"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      For philosophers: birth year. For concepts/movements: origination year.
                    </p>
                  </div>

                  {/* End Year */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="endYear" className="block text-sm font-medium text-gray-700">
                      End Year
                    </label>
                    <input
                      type="number"
                      name="endYear"
                      id="endYear"
                      value={formData.endYear || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="9999"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      For philosophers: death year. For movements: end year if applicable.
                    </p>
                  </div>

                  {/* Type-specific fields */}
                  {renderTypeSpecificFields()}
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Link
                  href="/admin/philosophical-entities"
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
                    <>{isEditMode ? 'Update Entity' : 'Create Entity'}</>
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

export default EntityForm;
