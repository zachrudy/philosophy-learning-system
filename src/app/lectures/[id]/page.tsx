import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import LectureDetailContainer from '@/components/student/lecture-detail/LectureDetailContainer';
import Header from '@/components/common/Header';

export default async function LecturePage({ params }: { params: { id: string } }) {
  // Check if user is authenticated
  const session = await getServerSession();

  if (!session) {
    // Redirect to login if not authenticated
    redirect('/auth/signin?callbackUrl=/lectures/' + params.id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <LectureDetailContainer lectureId={params.id} userId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
