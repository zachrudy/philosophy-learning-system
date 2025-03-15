import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import LectureForm from '@/components/admin/lectures/LectureForm';

export const metadata: Metadata = {
  title: 'Create New Lecture | Admin Dashboard',
  description: 'Create a new lecture in the Philosophy Learning System',
};

export default function NewLecturePage() {
  return (
    <AdminLayout>
      <LectureForm />
    </AdminLayout>
  );
}
