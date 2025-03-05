import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import EntityList from '@/components/admin/philosophical-entities/EntityList';

export const metadata: Metadata = {
  title: 'Manage Philosophical Entities | Admin Dashboard',
  description: 'Manage philosophical entities in the Philosophy Learning System',
};

export default function PhilosophicalEntitiesPage() {
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <EntityList />
      </div>
    </AdminLayout>
  );
}
