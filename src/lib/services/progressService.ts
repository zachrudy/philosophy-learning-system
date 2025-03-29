// src/lib/services/progressService.ts

/**
 * Service for progress-related API operations
 */

/**
 * Fetches a user's progress for a specific lecture
 */
export async function getUserProgressForLecture(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/users/${userId}/progress?lectureId=${lectureId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data, // API returns { data: progressData }
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Updates a user's progress status for a lecture
 */
export async function updateProgressStatus(userId: string, lectureId: string, status: string) {
  try {
    const response = await fetch(`/api/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        lectureId,
        status
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update progress: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error updating progress status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Creates a new progress record if one doesn't exist
 */
export async function createProgressRecord(userId: string, lectureId: string, status: string = 'READY') {
  try {
    const response = await fetch(`/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        lectureId,
        status
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create progress record: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error creating progress record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Get lecture completion status with detailed information
 */
export async function getLectureCompletionStatus(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/lectures/${lectureId}/completion-status?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get completion status: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error getting completion status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
