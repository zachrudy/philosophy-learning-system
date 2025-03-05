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
    title: 'Edit Relationship | Admin Dashboard',
    description: 'Edit a relationship between philosophical entities',
  };
}

export default function EditRelationshipPage({ params }: PageProps) {
  return (
    <AdminLayout>
      <RelationshipForm relationshipId={params.id} />
    </AdminLayout>
  );
}
