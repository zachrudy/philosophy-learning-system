// src/components/student/lecture-detail/WorkflowIndicator.tsx

'use client';

import React from 'react';

interface WorkflowStep {
  key: string;
  label: string;
  description: string;
}

interface WorkflowIndicatorProps {
  currentStatus: string;
}

export default function WorkflowIndicator({ currentStatus }: WorkflowIndicatorProps) {
  // Define the workflow steps in order
  const workflowSteps: WorkflowStep[] = [
    {
      key: 'READY',
      label: 'Pre-Lecture',
      description: 'Activate prior knowledge'
    },
    {
      key: 'STARTED',
      label: 'View Lecture',
      description: 'Watch the lecture content'
    },
    {
      key: 'WATCHED',
      label: 'Initial Reflection',
      description: 'Reflect on key ideas'
    },
    {
      key: 'INITIAL_REFLECTION',
      label: 'Mastery',
      description: 'Demonstrate understanding'
    },
    {
      key: 'MASTERY_TESTING',
      label: 'Evaluation',
      description: 'Receive feedback'
    },
    {
      key: 'MASTERED',
      label: 'Completed',
      description: 'Lecture mastered'
    }
  ];

  // Find the current step index
  const getCurrentStepIndex = () => {
    // Special case for LOCKED status
    if (currentStatus === 'LOCKED') return -1;

    const index = workflowSteps.findIndex(step => step.key === currentStatus);
    return index >= 0 ? index : 0; // Default to first step if not found
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="relative">
        {/* Progress bar */}
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{
              width: currentStepIndex >= 0
                ? `${Math.min(100, (currentStepIndex / (workflowSteps.length - 1)) * 100)}%`
                : '0%'
            }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          ></div>
        </div>

        {/* Steps */}
        <div className="hidden sm:grid grid-cols-6 gap-2">
          {workflowSteps.map((step, index) => (
            <div
              key={step.key}
              className="flex flex-col items-center"
            >
              {/* Circle indicator */}
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  index < currentStepIndex
                    ? 'bg-blue-500 border-blue-500 text-white' // Completed
                    : index === currentStepIndex
                      ? 'border-blue-500 text-blue-700' // Current
                      : 'border-gray-300 text-gray-400' // Upcoming
                }`}
              >
                {index < currentStepIndex
                  ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )
                  : index + 1
                }
              </div>

              {/* Label */}
              <div className="mt-1 text-xs text-center">
                <p className={`font-medium ${
                  index <= currentStepIndex ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-gray-500 hidden md:block">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile view - just show current step */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Step {currentStepIndex + 1} of {workflowSteps.length}:
                {' '}{currentStepIndex >= 0 && workflowSteps[currentStepIndex].label}
              </p>
              <p className="text-xs text-gray-500">
                {currentStepIndex >= 0 && workflowSteps[currentStepIndex].description}
              </p>
            </div>
            <div className="text-blue-700">
              {currentStepIndex + 1}/{workflowSteps.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
