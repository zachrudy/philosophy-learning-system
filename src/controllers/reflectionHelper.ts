import { Reflection } from '@prisma/client';
import { serializeJsonForDb, deserializeJsonFromDb } from '@/lib/constants';

/**
 * Type for AI evaluation data
 */
export interface AIEvaluationData {
  score: number;
  feedback: string;
  areas: {
    strength: string[];
    improvement: string[];
  };
  conceptualUnderstanding: number;
  criticalThinking: number;
}

/**
 * Transform a Reflection from the database to include parsed JSON
 */
export function transformReflectionFromDb(reflection: Reflection): Reflection & {
  parsedEvaluation: AIEvaluationData | null
} {
  return {
    ...reflection,
    parsedEvaluation: deserializeJsonFromDb<AIEvaluationData>(reflection.aiEvaluation),
  };
}

/**
 * Prepare a Reflection for database storage by serializing JSON
 */
export function prepareReflectionForDb(
  reflection: Omit<Reflection, 'aiEvaluation'> & {
    aiEvaluation?: AIEvaluationData | null
  }
): Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'> {
  // Extract the aiEvaluation field
  const { aiEvaluation, ...rest } = reflection;

  // Return the reflection with serialized aiEvaluation
  return {
    ...rest,
    aiEvaluation: aiEvaluation ? serializeJsonForDb(aiEvaluation) : null,
  };
}

/**
 * Group reflections by promptType
 */
export function groupReflectionsByPromptType(reflections: Reflection[]) {
  const grouped = reflections.reduce((acc, reflection) => {
    const promptType = reflection.promptType;
    if (!acc[promptType]) {
      acc[promptType] = [];
    }
    acc[promptType].push(reflection);
    return acc;
  }, {} as Record<string, Reflection[]>);

  return grouped;
}

/**
 * Convert reflections to markdown format for export
 */
export function reflectionsToMarkdown(reflections: Reflection[], lecture?: {title: string, description: string}) {
  let markdown = '';

  if (lecture) {
    markdown += `# Reflections on "${lecture.title}"\n\n`;
    markdown += `${lecture.description}\n\n`;
  } else {
    markdown += `# Reflections\n\n`;
  }

  const grouped = groupReflectionsByPromptType(reflections);

  // Sort by prompt type to maintain a logical order
  const promptOrder = ['pre-lecture', 'initial', 'mastery', 'discussion'];

  for (const promptType of promptOrder) {
    const promptReflections = grouped[promptType];
    if (promptReflections && promptReflections.length > 0) {
      // Convert prompt type to readable format
      const readablePromptType = promptType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      markdown += `## ${readablePromptType} Reflections\n\n`;

      // Sort reflections by date
      promptReflections.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const reflection of promptReflections) {
        const date = new Date(reflection.createdAt).toLocaleDateString();
        markdown += `### ${date}\n\n`;
        markdown += `${reflection.content}\n\n`;

        // Include AI feedback if available
        const evaluation = deserializeJsonFromDb<AIEvaluationData>(reflection.aiEvaluation);
        if (evaluation) {
          markdown += `#### Feedback\n\n`;
          markdown += `${evaluation.feedback}\n\n`;

          if (evaluation.areas.strength.length > 0) {
            markdown += `**Strengths:**\n\n`;
            for (const strength of evaluation.areas.strength) {
              markdown += `- ${strength}\n`;
            }
            markdown += '\n';
          }

          if (evaluation.areas.improvement.length > 0) {
            markdown += `**Areas for Improvement:**\n\n`;
            for (const improvement of evaluation.areas.improvement) {
              markdown += `- ${improvement}\n`;
            }
            markdown += '\n';
          }
        }

        markdown += `---\n\n`;
      }
    }
  }

  return markdown;
}
