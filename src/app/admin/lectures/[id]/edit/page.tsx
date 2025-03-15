import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import LectureForm from '@/components/admin/lectures/LectureForm';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Edit Lecture | Admin Dashboard',
    description: 'Edit a lecture in the Philosophy Learning System',
  };
}

export default function EditLecturePage({ params }: PageProps) {
  return (
    <AdminLayout>
      <LectureForm lectureId={params.id} />
    </AdminLayout>
  );
}
