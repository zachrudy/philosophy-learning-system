'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PrerequisiteSelect from './PrerequisiteSelect';
import EntityRelationshipSelect from './EntityRelationshipSelect';

// Define prerequisite type
interface Prerequisite {
  id: string;
  isRequired: boolean;
  importanceLevel: number;
}

// Define entity relationship type
interface EntityRelationship {
  entityId: string;
  relationType: string;
}

// Define the lecture type
interface Lecture {
  id?: string;
  title: string;
  description: string;
  contentUrl: string;
  lecturerName: string;
  contentType: string;
  category: string;
  order: number;
  embedAllowed: boolean;
  sourceAttribution: string;
  preLecturePrompt: string;
  initialPrompt: string;
  masteryPrompt: string;
  evaluationPrompt: string;
  discussionPrompts: string;
  prerequisiteIds?: Prerequisite[]; // Array of prerequisite IDs with metadata
  entityRelations?: EntityRelationship[]; // Array of entity relationships
}

interface LectureFormProps {
  lectureId?: string; // If provided, we're in edit mode
  initialData?: Partial<Lecture>; // Optional initial data
}

const LectureForm: React.FC<LectureFormProps> = ({ lectureId, initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Lecture>>({
    title: '',
    description: '',
    contentUrl: '',
    lecturerName: 'Michael Sugrue', // Default value
    contentType: 'video',
    category: '',
    order: 0,
    embedAllowed: true,
    sourceAttribution: '',
    preLecturePrompt: '',
    initialPrompt: '',
    masteryPrompt: '',
    evaluationPrompt: '',
    discussionPrompts: '',
    prerequisiteIds: [],
    ...initialData
  });

  // Handle prerequisites separately for easier management
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>(
    initialData?.prerequisiteIds || []
  );

  const isEditMode = !!lectureId;

  // Fetch lecture data if editing
  useEffect(() => {
    if (isEditMode && !initialData) {
      const fetchLecture = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/lectures/${lectureId}?includePrerequisites=true`);

          if (!response.ok) {
            throw new Error('Failed to fetch lecture');
          }

          const data = await response.json();
          setFormData(data);

          // Extract prerequisites if they exist
          if (data.prerequisites) {
            // Map to the format our component expects
            const mappedPrerequisites = data.prerequisites.map((prereq: any) => ({
              id: prereq.prerequisiteLectureId,
              isRequired: prereq.isRequired,
              importanceLevel: prereq.importanceLevel
            }));
            setPrerequisites(mappedPrerequisites);
          }
        } catch (err) {
          console.error('Error fetching lecture:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchLecture();
    }
  }, [lectureId, initialData, isEditMode]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Special handling for numeric fields
    if (name === 'order') {
      // Ensure it's a positive number (including zero)
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 1 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Process and submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFormSubmitted(true);

    try {
      // Basic validation
      if (!formData.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description?.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.contentUrl?.trim()) {
        throw new Error('Content URL is required');
      }
      if (!formData.category?.trim()) {
        throw new Error('Category is required');
      }

      // Check for the five prompts
      if (!formData.preLecturePrompt?.trim()) {
        throw new Error('Pre-lecture prompt is required');
      }
      if (!formData.initialPrompt?.trim()) {
        throw new Error('Initial prompt is required');
      }
      if (!formData.masteryPrompt?.trim()) {
        throw new Error('Mastery prompt is required');
      }
      if (!formData.evaluationPrompt?.trim()) {
        throw new Error('Evaluation prompt is required');
      }
      if (!formData.discussionPrompts?.trim()) {
        throw new Error('Discussion prompts are required');
      }

      // Prepare the data to send
      const dataToSubmit = {
        ...formData,
        prerequisiteIds: prerequisites.length > 0 ? prerequisites : undefined
      };

      // Prepare the API request
      const url = isEditMode
        ? `/api/lectures/${lectureId}`
        : '/api/lectures';

      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred during submission');
      }

      const result = await response.json();

      // Set success message based on the operation
      setSuccess(isEditMode
        ? 'Lecture updated successfully'
        : 'Lecture created successfully'
      );

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/lectures');
      }, 1500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formSubmitted && !formData.title) {
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
            {isEditMode ? 'Edit Lecture' : 'Create New Lecture'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Update the details of this lecture.'
              : 'Fill out the form to add a new lecture to the system.'}
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
                  {/* Basic Information Section */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Basic Information</h4>
                  </div>

                  {/* Title */}
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Content URL */}
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700">
                      Content URL *
                    </label>
                    <input
                      type="url"
                      name="contentUrl"
                      id="contentUrl"
                      value={formData.contentUrl || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Lecturer Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="lecturerName" className="block text-sm font-medium text-gray-700">
                      Lecturer Name *
                    </label>
                    <input
                      type="text"
                      name="lecturerName"
                      id="lecturerName"
                      value={formData.lecturerName || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Content Type */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
                      Content Type *
                    </label>
                    <select
                      id="contentType"
                      name="contentType"
                      value={formData.contentType || 'video'}
                      onChange={handleInputChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="text">Text</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      id="category"
                      value={formData.category || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Order */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                      Order *
                    </label>
                    <input
                      type="number"
                      name="order"
                      id="order"
                      value={formData.order || 0}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      min="0"
                    />
                  </div>

                  {/* Source Attribution */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="sourceAttribution" className="block text-sm font-medium text-gray-700">
                      Source Attribution *
                    </label>
                    <input
                      type="text"
                      name="sourceAttribution"
                      id="sourceAttribution"
                      value={formData.sourceAttribution || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Embed Allowed */}
                  <div className="col-span-6 sm:col-span-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="embedAllowed"
                          name="embedAllowed"
                          type="checkbox"
                          checked={formData.embedAllowed !== false}
                          onChange={handleCheckboxChange}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="embedAllowed" className="font-medium text-gray-700">
                          Allow Embedding
                        </label>
                        <p className="text-gray-500">Whether this content can be embedded in an iframe</p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Section */}
                  <div className="col-span-6 mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Learning Prompts</h4>
                  </div>

                  {/* Pre-Lecture Prompt */}
                  <div className="col-span-6">
                    <label htmlFor="preLecturePrompt" className="block text-sm font-medium text-gray-700">
                      Pre-Lecture Prompt *
                    </label>
                    <textarea
                      id="preLecturePrompt"
                      name="preLecturePrompt"
                      rows={3}
                      value={formData.preLecturePrompt || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Questions or tasks for the student before watching the lecture"
                    />
                  </div>

                  {/* Initial Prompt */}
                  <div className="col-span-6">
                    <label htmlFor="initialPrompt" className="block text-sm font-medium text-gray-700">
                      Initial Prompt *
                    </label>
                    <textarea
                      id="initialPrompt"
                      name="initialPrompt"
                      rows={3}
                      value={formData.initialPrompt || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Initial reflection questions after watching the lecture"
                    />
                  </div>

                  {/* Mastery Prompt */}
                  <div className="col-span-6">
                    <label htmlFor="masteryPrompt" className="block text-sm font-medium text-gray-700">
                      Mastery Prompt *
                    </label>
                    <textarea
                      id="masteryPrompt"
                      name="masteryPrompt"
                      rows={3}
                      value={formData.masteryPrompt || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Deeper questions to demonstrate understanding of the material"
                    />
                  </div>

                  {/* Evaluation Prompt */}
                  <div className="col-span-6">
                    <label htmlFor="evaluationPrompt" className="block text-sm font-medium text-gray-700">
                      Evaluation Prompt *
                    </label>
                    <textarea
                      id="evaluationPrompt"
                      name="evaluationPrompt"
                      rows={3}
                      value={formData.evaluationPrompt || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Criteria for evaluating mastery responses"
                    />
                  </div>

                  {/* Discussion Prompts */}
                  <div className="col-span-6">
                    <label htmlFor="discussionPrompts" className="block text-sm font-medium text-gray-700">
                      Discussion Prompts *
                    </label>
                    <textarea
                      id="discussionPrompts"
                      name="discussionPrompts"
                      rows={3}
                      value={formData.discussionPrompts || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Prompts for further discussion and exploration"
                    />
                  </div>

                  {/* Prerequisites Section */}
                  <div className="col-span-6 mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Prerequisites</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Select lectures that students should complete before this one.
                    </p>

                    <PrerequisiteSelect
                      lectureId={lectureId}
                      selectedPrerequisites={prerequisites}
                      onChange={setPrerequisites}
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Link
                  href="/admin/lectures"
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
                    <>{isEditMode ? 'Update Lecture' : 'Create Lecture'}</>
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

export default LectureForm;
