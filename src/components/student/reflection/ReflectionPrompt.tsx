// src/components/student/reflection/ReflectionPrompt.tsx
import React from 'react';
import { BookOpenIcon, PencilIcon, AcademicCapIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ReflectionPromptProps {
  lecture: {
    id: string;
    title: string;
    preLecturePrompt: string;
    initialPrompt: string;
    masteryPrompt: string;
    discussionPrompts: string;
  };
  promptType: 'pre-lecture' | 'initial' | 'mastery' | 'discussion';
  className?: string;
}

const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({
  lecture,
  promptType,
  className = '',
}) => {
  // Set prompt text and icon based on prompt type
  let promptText = '';
  let promptTitle = '';
  let Icon = PencilIcon;

  switch (promptType) {
    case 'pre-lecture':
      promptText = lecture.preLecturePrompt;
      promptTitle = 'Pre-Lecture Reflection';
      Icon = BookOpenIcon;
      break;
    case 'initial':
      promptText = lecture.initialPrompt;
      promptTitle = 'Initial Reflection';
      Icon = PencilIcon;
      break;
    case 'mastery':
      promptText = lecture.masteryPrompt;
      promptTitle = 'Mastery Reflection';
      Icon = AcademicCapIcon;
      break;
    case 'discussion':
      promptText = lecture.discussionPrompts;
      promptTitle = 'Discussion Prompts';
      Icon = ChatBubbleLeftRightIcon;
      break;
  }

  return (
    <div className={`bg-blue-50 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center mb-3">
        <Icon className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium text-blue-800">{promptTitle}</h3>
      </div>
      <div className="prose max-w-none text-gray-700">
        <p>{promptText}</p>
      </div>
    </div>
  );
};

export default ReflectionPrompt;
