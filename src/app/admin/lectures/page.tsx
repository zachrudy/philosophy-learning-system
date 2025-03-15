'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';

// Define the lecture type for the list
interface Lecture {
  id: string;
  title: string;
  category: string;
  lecturerName: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/lectures');

        if (!response.ok) {
          throw new Error('Failed to fetch lectures');
        }

        const data = await response.json();
        setLectures(data.data || []);
      } catch (err) {
        console.error('Error fetching lectures:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  // Group lectures by category for better organization
  const getLecturesByCategory = () => {
    const categories: Record<string, Lecture[]> = {};

    lectures.forEach(lecture => {
      if (!categories[lecture.category]) {
        categories[lecture.category] = [];
      }
      categories[lecture.category].push(lecture);
    });

    // Sort lectures by order within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.order - b.order);
    });

    return categories;
  };

  const categorizedLectures = getLecturesByCategory();

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lectures</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage lectures in the Philosophy Learning System
          </p>
        </div>
        <Link
          href="/admin/lectures/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Lecture
        </Link>
      </div>

      <div className="px-4 sm:px-6 pb-5">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
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
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lectures</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new lecture.</p>
            <div className="mt-6">
              <Link
                href="/admin/lectures/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Lecture
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            {Object.entries(categorizedLectures).map(([category, categoryLectures]) => (
              <div key={category} className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  {category}
                </h2>
                <ul role="list" className="divide-y divide-gray-200">
                  {categoryLectures.map((lecture) => (
                    <li key={lecture.id}>
                      <div className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-blue-600 truncate">{lecture.title}</p>
                              <p className="ml-2 text-xs text-gray-500 border border-gray-200 rounded-full px-2">
                                Order: {lecture.order}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <Link
                                href={`/admin/lectures/${lecture.id}/edit`}
                                className="px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 mr-2"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this lecture?')) {
                                    try {
                                      const response = await fetch(`/api/lectures/${lecture.id}`, {
                                        method: 'DELETE',
                                      });

                                      if (!response.ok) {
                                        throw new Error('Failed to delete lecture');
                                      }

                                      // Refresh the list
                                      setLectures(lectures.filter(l => l.id !== lecture.id));
                                    } catch (err) {
                                      console.error('Error deleting lecture:', err);
                                      alert('Error deleting lecture: ' + (err instanceof Error ? err.message : 'An error occurred'));
                                    }
                                  }
                                }}
                                className="px-3 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {lecture.lecturerName}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Updated {new Date(lecture.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
