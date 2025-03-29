// src/components/student/reflection/AIEvaluationResult.tsx

'use client';

import React, { useState } from 'react';

interface AIEvaluation {
  score: number;
  feedback: string;
  areas: {
    strength: string[];
    improvement: string[];
  };
  conceptualUnderstanding: number;
  criticalThinking: number;
}

interface AIEvaluationResultProps {
  evaluation: AIEvaluation | null;
  mastered: boolean;
  className?: string;
  compact?: boolean;
}

const AIEvaluationResult: React.FC<AIEvaluationResultProps> = ({
  evaluation,
  mastered,
  className = '',
  compact = false
}) => {
  const [expanded, setExpanded] = useState(!compact);

  if (!evaluation) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 italic">No evaluation available.</p>
      </div>
    );
  }

  // Format score to 1 decimal place
  const formattedScore = evaluation.score.toFixed(1);

  // Determine score color based on value
  const getScoreColor = () => {
    if (evaluation.score >= 90) return 'text-green-600';
    if (evaluation.score >= 80) return 'text-green-500';
    if (evaluation.score >= 70) return 'text-blue-500';
    if (evaluation.score >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  // Render a score indicator (circular progress)
  const ScoreIndicator = () => (
    <div className="flex items-center justify-center">
      <div className="relative inline-flex">
        <div className="w-16 h-16 rounded-full bg-gray-200">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${mastered ? '#4ADE80' : '#3B82F6'} ${evaluation.score}%, transparent 0)`,
              maskImage: 'radial-gradient(transparent 55%, black 55%)',
              WebkitMaskImage: 'radial-gradient(transparent 55%, black 55%)',
            }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${getScoreColor()}`}>
            {formattedScore}
          </span>
        </div>
      </div>
    </div>
  );

  // Render category score (conceptual understanding, critical thinking)
  const CategoryScore = ({ label, score }: { label: string, score: number }) => (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-medium text-gray-700">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  // Compact version of the component
  if (compact && !expanded) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ScoreIndicator />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {mastered ? 'Mastery Achieved' : 'Evaluation Result'}
              </p>
              <p className="text-xs text-gray-500">
                {mastered ? 'Great job!' : evaluation.score >= 60 ? 'Good progress' : 'Needs improvement'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  // Full expanded version
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {mastered ? 'Mastery Achieved' : 'Evaluation Result'}
        </h3>

        {compact && (
          <button
            onClick={() => setExpanded(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Score and Summary */}
      <div className="flex items-start mb-4">
        <ScoreIndicator />

        <div className="ml-4 flex-1">
          <p className={`text-lg font-bold ${getScoreColor()}`}>
            Score: {formattedScore}/100
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {mastered
              ? 'Congratulations! You\'ve demonstrated mastery of this lecture.'
              : `You need ${Math.max(0, 70 - evaluation.score).toFixed(1)} more points to achieve mastery.`
            }
          </p>

          {/* Category scores */}
          <div className="mt-2">
            <CategoryScore label="Conceptual Understanding" score={evaluation.conceptualUnderstanding} />
            <CategoryScore label="Critical Thinking" score={evaluation.criticalThinking} />
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-900 mb-2">Feedback</h4>
        <p className="text-sm text-gray-700">{evaluation.feedback}</p>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-green-800 mb-2">Strengths</h4>
          {evaluation.areas.strength.length > 0 ? (
            <ul className="text-sm text-green-700 list-disc pl-5 space-y-1">
              {evaluation.areas.strength.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-700 italic">No specific strengths identified.</p>
          )}
        </div>

        <div className="bg-yellow-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
          {evaluation.areas.improvement.length > 0 ? (
            <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
              {evaluation.areas.improvement.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-yellow-700 italic">No specific areas for improvement identified.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationResult;
