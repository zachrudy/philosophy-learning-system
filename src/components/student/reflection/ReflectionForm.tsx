// src/components/student/reflection/ReflectionForm.tsx
import React, { useState, useEffect } from 'react';
import { reflectionService } from '@/lib/services/reflectionService';
import WordCounter from './WordCounter';

interface ReflectionFormProps {
  lectureId: string;
  promptType: 'pre-lecture' | 'initial' | 'mastery' | 'discussion';
  onSubmitSuccess?: (content: string) => void;
  minimumWords?: number;
  initialContent?: string;
  className?: string;
}

const ReflectionForm: React.FC<ReflectionFormProps> = ({
  lectureId,
  promptType,
  onSubmitSuccess,
  minimumWords = 30,
  initialContent = '',
  className = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate word count when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate minimum word count
    if (wordCount < minimumWords) {
      setError(`Your reflection must be at least ${minimumWords} words.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await reflectionService.submitReflection(
        lectureId,
        promptType,
        content
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit reflection');
      }

      setIsSubmitted(true);

      // Call the onSubmitSuccess callback with the content
      if (onSubmitSuccess) {
        onSubmitSuccess(content);
      }
    } catch (err) {
      console.error('Error submitting reflection:', err);
      setError('Failed to submit your reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && !onSubmitSuccess) {
    // Only show this if there's no onSubmitSuccess handler
    // If there is one, let the parent component handle the success state
    return (
      <div className={`bg-green-50 rounded-lg p-6 text-center ${className}`}>
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-green-800 mb-2">Reflection Submitted</h3>
        <p className="text-green-600">Your reflection has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 mb-2">
            Your Reflection
          </label>
          <textarea
            id="reflection"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Write your reflection here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="flex items-center justify-between mb-4">
          <WordCounter
            currentCount={wordCount}
            minimumCount={minimumWords}
          />

          <button
            type="submit"
            disabled={wordCount < minimumWords || isSubmitting}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              wordCount >= minimumWords && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Submitting...
              </>
            ) : (
              'Submit Reflection'
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default ReflectionForm;
