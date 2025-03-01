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
