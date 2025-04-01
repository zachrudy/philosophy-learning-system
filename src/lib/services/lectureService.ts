/**
 * Service for lecture-related API operations
 */

/**
 * Fetches detailed information about a lecture including prerequisites and entities
 */
 // In src/lib/services/lectureService.ts
 export async function fetchLectureDetails(lectureId: string) {
   try {
     console.log(`Fetching lecture details for ID: ${lectureId}`);
     const response = await fetch(`/api/lectures/${lectureId}?includeEntities=true&includePrerequisites=true`);

     console.log(`Response status: ${response.status}`);

     if (!response.ok) {
       console.log(`Error response: ${response.status}`);
       return {
         success: false,
         error: `Failed to fetch lecture: ${response.status}`,
       };
     }

     const data = await response.json();
     console.log('Lecture data:', data);

     if (!data || Object.keys(data).length === 0) {
       console.log('Empty data received');
       return {
         success: false,
         error: 'Lecture not found',
       };
     }

     return {
       success: true,
       data,
     };
   } catch (error) {
     console.error('Error fetching lecture details:', error);
     return {
       success: false,
       error: error instanceof Error ? error.message : 'An error occurred',
     };
   }
 }

/**
 * Checks if prerequisites are satisfied for a lecture
 */
export async function checkPrerequisitesSatisfied(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/lectures/${lectureId}/prerequisites/check?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prerequisites: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Updates the lecture status to mark it as started
 */
export async function startLecture(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/student/lectures/${lectureId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start lecture: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error starting lecture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Marks a lecture as viewed
 */
export async function markLectureViewed(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/student/lectures/${lectureId}/viewed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark lecture as viewed: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error marking lecture as viewed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Gets the lecture workflow state
 */
export async function getLectureWorkflowState(userId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/student/lectures/${lectureId}/workflow-state?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow state: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error getting workflow state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export async function fetchAdjacentLectures(lectureId: string, userId: string) {
  try {
    const response = await fetch(`/api/lectures/${lectureId}/adjacent?userId=${userId}`);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch adjacent lectures: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching adjacent lectures:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
