'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { useSession } from 'next-auth/react';

// Define the entity type from our models
type PhilosophicalEntity = {
  id: string;
  type: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Type for pagination data
type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Type for API response
type EntityResponse = {
  data: PhilosophicalEntity[];
  pagination: Pagination;
};

const EntityList: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [entities, setEntities] = useState<PhilosophicalEntity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check if user is authorized (admin or instructor)
  const isAuthorized =
    session?.user?.role === USER_ROLES.ADMIN ||
    session?.user?.role === USER_ROLES.INSTRUCTOR;

  // Redirect if not authorized
  useEffect(() => {
    if (session && !isAuthorized) {
      router.push('/dashboard');
    }
  }, [session, isAuthorized, router]);

  // Fetch entities with pagination and filters
  const fetchEntities = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build the query URL with pagination and filters
      let url = `/api/philosophical-entities?page=${page}&limit=${pagination.limit}`;

      if (typeFilter) {
        url += `&type=${encodeURIComponent(typeFilter)}`;
      }

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }

      const data: EntityResponse = await response.json();
      setEntities(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (isAuthorized) {
      fetchEntities();
    }
  }, [isAuthorized]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEntities(newPage);
    }
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntities(1); // Reset to first page when searching
  };

  // Handle entity deletion
  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/philosophical-entities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entity');
      }

      // Refresh the entity list
      fetchEntities(pagination.page);
    } catch (err) {
      console.error('Error deleting entity:', err);
      alert(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  // If loading, show a loading spinner
  if (loading && entities.length === 0) {
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
              onClick={() => fetchEntities(pagination.page)}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Philosophical Entities</h1>
        <Link
          href="/admin/philosophical-entities/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Entity
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Philosopher">Philosophers</option>
              <option value="PhilosophicalConcept">Concepts</option>
              <option value="Branch">Branches</option>
              <option value="Movement">Movements</option>
              <option value="Problematic">Problematics</option>
              <option value="Era">Eras</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Entity Table */}
      {entities.length > 0 ? (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {entity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {entity.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/philosophical-entities/${entity.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/philosophical-entities/${entity.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteEntity(entity.id)}
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
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No entities found. Create a new entity or adjust your filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-lg shadow sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{entities.length ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">First</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Calculate page numbers to show around current page
                  const pageNumbers = [];
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2));
                  let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

                  // Adjust startPage if we're near the end
                  if (endPage - startPage + 1 < maxPagesToShow) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(i);
                  }

                  return pageNumbers.map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={pagination.page === pageNum ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ));
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityList;
