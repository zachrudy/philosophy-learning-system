import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import EntityForm from '@/components/admin/philosophical-entities/EntityForm';

export const metadata: Metadata = {
  title: 'Create New Philosophical Entity | Admin Dashboard',
  description: 'Create a new philosophical entity in the Philosophy Learning System',
};

export default function NewPhilosophicalEntityPage() {
  return (
    <AdminLayout>
      <EntityForm />
    </AdminLayout>
  );
}
