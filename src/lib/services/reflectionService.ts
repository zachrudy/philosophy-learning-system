// src/lib/services/reflectionService.ts

/**
 * Service for reflection-related API operations
 */

/**
 * Submits a new reflection
 */
export async function submitReflection(lectureId: string, promptType: string, content: string) {
  try {
    const response = await fetch(`/api/reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lectureId,
        promptType,
        content
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit reflection: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error submitting reflection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Fetches reflections for a specific lecture and user
 */
export async function getLectureReflections(lectureId: string, userId?: string, promptType?: string) {
  try {
    let url = `/api/lectures/${lectureId}/reflections`;

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (promptType) params.append('promptType', promptType);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reflections: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data, // API returns { data: reflectionsData }
    };
  } catch (error) {
    console.error('Error fetching reflections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Fetches a specific reflection by ID
 */
export async function getReflectionById(reflectionId: string) {
  try {
    const response = await fetch(`/api/reflections/${reflectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reflection: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error fetching reflection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Updates a reflection with AI evaluation results
 */
export async function submitAIEvaluation(reflectionId: string, evaluationData: {
  score: number;
  feedback: string;
  areas: {
    strength: string[];
    improvement: string[];
  };
  conceptualUnderstanding: number;
  criticalThinking: number;
}) {
  try {
    const response = await fetch(`/api/reflections/${reflectionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aiEvaluation: evaluationData,
        status: 'EVALUATED',
        score: evaluationData.score
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit evaluation: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
