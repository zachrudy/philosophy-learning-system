'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/common/Header';
import AuthGuard from '@/components/auth/AuthGuard';

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    _count: {
      progress: number;
      reflections: number;
    };
  };
  recentProgress: Array<{
    id: string;
    status: string;
    updatedAt: string;
  }>;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfileData();
    }
  }, [session]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setProfileData(data);
      setName(data.user.name);
    } catch (error) {
      setError('Failed to load profile data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();

      // Update the profile data with the new user info
      if (profileData) {
        setProfileData({
          ...profileData,
          user: {
            ...profileData.user,
            ...updatedUser,
          },
        });
      }

      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-blue-600 px-4 py-5 sm:px-6">
              <h1 className="text-2xl font-bold text-white">Your Profile</h1>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={fetchProfileData}
                    className="mt-2 text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : !profileData ? (
                <p>No profile data available</p>
              ) : (
                <>
                  {isEditing ? (
                    <div className="mb-6 max-w-lg">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        disabled={isSaving}
                      />

                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setName(profileData.user.name);
                          }}
                          disabled={isSaving}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{profileData.user.name}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{profileData.user.email}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Role</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {profileData.user.role}
                            </span>
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Edit Profile
                          </button>
                        </div>
                      </dl>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Learning Progress</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Lectures in Progress</p>
                        <p className="text-3xl font-bold">{profileData.user._count.progress}</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">Reflections Submitted</p>
                        <p className="text-3xl font-bold">{profileData.user._count.reflections}</p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-yellow-600 font-medium">Concepts Explored</p>
                        <p className="text-3xl font-bold">-</p>
                      </div>
                    </div>

                    {profileData.recentProgress.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-md font-medium text-gray-900 mb-2">Recent Activity</h3>
                        <ul className="divide-y divide-gray-200">
                          {profileData.recentProgress.map((progress) => (
                            <li key={progress.id} className="py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    Status updated to {progress.status}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(progress.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
