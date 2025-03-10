// src/controllers/reflectionHelper.ts
// This file is maintained for backward compatibility
// New code should import from '@/lib/transforms' directly

import {
  transformReflection,
  prepareReflectionForDb,
  groupReflectionsByPromptType,
  reflectionsToMarkdown,
  AIEvaluationData
} from '@/lib/transforms';

// Re-export for backward compatibility
export {
  transformReflection,
  prepareReflectionForDb,
  groupReflectionsByPromptType,
  reflectionsToMarkdown
};

// Re-export the interface
export type { AIEvaluationData };

// Add a deprecation notice when the module is imported
console.warn(
  'Warning: reflectionHelper.ts is deprecated. ' +
  'Please import from @/lib/transforms instead.'
);
