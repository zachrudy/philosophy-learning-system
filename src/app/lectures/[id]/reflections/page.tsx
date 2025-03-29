// src/app/lectures/[id]/reflections/page.tsx

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Header from '@/components/common/Header';
import ReflectionHistory from '@/components/student/reflection/ReflectionHistory';
import Link from 'next/link';

export default async function LectureReflectionsPage({ params }: { params: { id: string } }) {
  // Check if user is authenticated
  const session = await getServerSession();

  if (!session) {
    // Redirect to login if not authenticated
    redirect('/auth/signin?callbackUrl=/lectures/' + params.id + '/reflections');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lecture Reflections</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review your reflections for this lecture
              </p>
            </div>
            <Link
              href={`/lectures/${params.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Lecture
            </Link>
          </div>

          <ReflectionHistory
            lectureId={params.id}
            userId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
