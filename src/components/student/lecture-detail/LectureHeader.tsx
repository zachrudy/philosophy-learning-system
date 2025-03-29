// src/components/student/lecture-detail/LectureHeader.tsx

'use client';

import React from 'react';
import Link from 'next/link';

interface LectureHeaderProps {
  lecture: {
    id: string;
    title: string;
    description: string;
    category: string;
    lecturerName: string;
    contentType: string;
    order: number;
    entities?: any[];
  };
}

export default function LectureHeader({ lecture }: LectureHeaderProps) {
  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>

          <div className="flex flex-wrap items-center mt-1 space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {lecture.category}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Lecture {lecture.order + 1}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {lecture.contentType}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-700">{lecture.description}</p>

          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Lecturer:</span> {lecture.lecturerName}
          </p>
        </div>

        {lecture.entities && lecture.entities.length > 0 && (
          <div className="hidden md:block ml-6 border-l border-gray-200 pl-6 min-w-[200px]">
            <h3 className="text-sm font-medium text-gray-700">Philosophical Concepts:</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {lecture.entities.slice(0, 5).map((entity) => (
                <span
                  key={entity.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {entity.name}
                </span>
              ))}
              {lecture.entities.length > 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{lecture.entities.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
