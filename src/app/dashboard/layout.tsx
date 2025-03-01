import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Header from '@/components/common/Header';
import Link from 'next/link';

// Define the layout props
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated server-side
  const session = await getServerSession();

  // If not authenticated, redirect to login
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 mb-6 md:mb-0">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-lg font-medium">Dashboard</h2>
                </div>
                <nav className="p-4 space-y-1">
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/dashboard/concepts"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Concepts
                  </Link>
                  <Link
                    href="/dashboard/lectures"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Lectures
                  </Link>
                  <Link
                    href="/dashboard/progress"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    My Progress
                  </Link>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
              <div className="bg-white shadow rounded-lg p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
