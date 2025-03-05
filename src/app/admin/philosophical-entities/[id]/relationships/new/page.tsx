import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import RelationshipForm from '@/components/admin/philosophical-entities/RelationshipForm';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Add New Relationship | Admin Dashboard',
    description: 'Create a new relationship between philosophical entities',
  };
}

export default function NewRelationshipPage({ params }: PageProps) {
  return (
    <AdminLayout>
      <RelationshipForm sourceEntityId={params.id} />
    </AdminLayout>
  );
}
