import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import EntityDetail from '@/components/admin/philosophical-entities/EntityDetail';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // You could fetch the entity here to include its name in the title
  // For simplicity, we'll use a generic title
  return {
    title: 'Philosophical Entity Details | Admin Dashboard',
    description: 'View details of a philosophical entity in the Philosophy Learning System',
  };
}

export default function ViewPhilosophicalEntityPage({ params }: PageProps) {
  return (
    <AdminLayout>
      <EntityDetail entityId={params.id} />
    </AdminLayout>
  );
}
