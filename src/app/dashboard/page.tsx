// src/app/dashboard/page.tsx
import React from 'react';
import DashboardContainer from '@/components/student/DashboardContainer';

/**
 * Student dashboard page
 */
export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Learning Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Continue your philosophical journey with lectures tailored to your progress.
        </p>
      </div>

      <DashboardContainer />
    </div>
  );
}
