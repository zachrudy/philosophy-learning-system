import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import EntityForm from '@/components/admin/philosophical-entities/EntityForm';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Edit Philosophical Entity | Admin Dashboard',
    description: 'Edit a philosophical entity in the Philosophy Learning System',
  };
}

export default function EditPhilosophicalEntityPage({ params }: PageProps) {
  return (
    <AdminLayout>
      <EntityForm entityId={params.id} />
    </AdminLayout>
  );
}
