// tests/api/lectures-prerequisites.test.ts
import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/lectures/[id]/prerequisites/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { USER_ROLES } from '@/lib/constants';

// First import the controller to see its structure
import { LecturePrerequisiteController } from '@/controllers/lecturePrerequisiteController';

// Debug: Log controller structure
console.log('Controller structure:', Object.keys(LecturePrerequisiteController));
console.log('getPrerequisitesForLecture type:', typeof LecturePrerequisiteController.getPrerequisitesForLecture);
console.log('Is function?', typeof LecturePrerequisiteController.getPrerequisitesForLecture === 'function');

// Only mock after investigation
jest.mock('next-auth/next');
jest.mock('@/lib/db/prisma');

describe('Lecture Prerequisites API Routes', () => {
  // Debug log before running tests
  beforeAll(() => {
    console.log('Before tests - Controller structure:', Object.keys(LecturePrerequisiteController));
  });

  // Use spyOn for mocking instead of complete mocking
  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on the controller methods
    jest.spyOn(LecturePrerequisiteController, 'getPrerequisitesForLecture').mockImplementation((lectureId, options) => {
      console.log('Mock getPrerequisitesForLecture called with:', lectureId, options);

      if (lectureId === 'non-existent-id') {
        return Promise.resolve({
          success: false,
          error: `Lecture with ID ${lectureId} not found`,
          statusCode: 404
        });
      }

      // Default success response
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 'prereq-1',
            lectureId,
            prerequisiteLectureId: 'lecture-2',
            isRequired: true,
            importanceLevel: 4,
            ...(options?.includeDetails ? {
              prerequisiteLecture: {
                id: 'lecture-2',
                title: 'Lecture 2',
                description: 'Description of lecture 2'
              }
            } : {})
          }
        ],
        metadata: {
          count: 1,
          lectureId,
          requiredCount: 1,
          includeDetails: options?.includeDetails || false
        }
      });
    });

    // Spy on addPrerequisite method
    jest.spyOn(LecturePrerequisiteController, 'addPrerequisite').mockImplementation((data) => {
      console.log('Mock addPrerequisite called with:', data);

      // Handle circular dependency case
      if (data.prerequisiteLectureId === 'circular-dependency-id') {
        return Promise.resolve({
          success: false,
          error: 'Adding this prerequisite would create a circular dependency',
          statusCode: 400,
          cycleDetails: {
            path: ['Lecture A', 'Lecture B', 'Lecture C', 'Lecture A'],
            description: 'Circular dependency detected'
          }
        });
      }

      // Handle duplicate prerequisite case
      if (data.prerequisiteLectureId === 'duplicate-prerequisite-id') {
        return Promise.resolve({
          success: false,
          error: 'This prerequisite relationship already exists',
          statusCode: 409,
          existingId: 'existing-prereq-id'
        });
      }

      // Handle validation error case
      if (data.prerequisiteLectureId === 'invalid-data-id') {
        return Promise.resolve({
          success: false,
          error: 'Validation failed: Invalid data',
          statusCode: 400,
          invalidFields: {
            prerequisiteLectureId: 'Invalid prerequisite ID format'
          }
        });
      }

      // Handle non-existent lecture case
      if (data.prerequisiteLectureId === 'non-existent-id') {
        return Promise.resolve({
          success: false,
          error: `Lecture with ID ${data.prerequisiteLectureId} not found`,
          statusCode: 404
        });
      }

      // Default success response
      return Promise.resolve({
        success: true,
        data: {
          id: 'new-prereq-id',
          ...data,
          lecture: {
            id: data.lectureId,
            title: 'Main Lecture'
          },
          prerequisiteLecture: {
            id: data.prerequisiteLectureId,
            title: 'Prerequisite Lecture'
          }
        },
        message: 'Prerequisite added successfully'
      });
    });

    // Spy on removePrerequisite method
    jest.spyOn(LecturePrerequisiteController, 'removePrerequisite').mockImplementation((prereqId) => {
      console.log('Mock removePrerequisite called with:', prereqId);

      // Handle non-existent prerequisite case
      if (prereqId === 'non-existent-prereq-id') {
        return Promise.resolve({
          success: false,
          error: `Prerequisite with ID ${prereqId} not found`,
          statusCode: 404
        });
      }

      // Default success response
      return Promise.resolve({
        success: true,
        message: 'Prerequisite removed successfully',
        metadata: {
          id: prereqId,
          lectureId: 'lecture-1',
          prerequisiteLectureId: 'lecture-2',
          isRequired: true,
          importanceLevel: 3
        }
      });
    });

    // Setup common mock for auth check
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: USER_ROLES.ADMIN
      }
    });

    // Setup common mock for user role lookup
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: USER_ROLES.ADMIN
    });
  });

  describe('GET /api/lectures/:id/prerequisites', () => {
    it('should return prerequisites for a lecture', async () => {
      const lectureId = 'lecture-1';

      // Create mock request with params and search params
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?includeDetails=false`),
        {}
      );

      // Execute the handler
      const response = await GET(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.metadata.count).toBe(1);
      expect(LecturePrerequisiteController.getPrerequisitesForLecture).toHaveBeenCalledWith(
        lectureId,
        expect.objectContaining({ includeDetails: false })
      );
    });

    it('should include details when requested', async () => {
      const lectureId = 'lecture-1';

      // Create mock request with params and search params
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?includeDetails=true`),
        {}
      );

      // Execute the handler
      const response = await GET(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data[0].prerequisiteLecture).toBeDefined();
      expect(LecturePrerequisiteController.getPrerequisitesForLecture).toHaveBeenCalledWith(
        lectureId,
        expect.objectContaining({ includeDetails: true })
      );
    });

    it('should return 400 if lecture ID is missing', async () => {
      // Create mock request with missing ID
      const mockRequest = new NextRequest(
        new URL('https://example.com/api/lectures//prerequisites'),
        {}
      );

      // Execute the handler
      const response = await GET(mockRequest, { params: { id: '' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Lecture ID is required');
      expect(LecturePrerequisiteController.getPrerequisitesForLecture).not.toHaveBeenCalled();
    });

    it('should return 404 if lecture not found', async () => {
      const lectureId = 'non-existent-id';

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {}
      );

      // Execute the handler
      const response = await GET(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe(`Lecture with ID ${lectureId} not found`);
      expect(LecturePrerequisiteController.getPrerequisitesForLecture).toHaveBeenCalledWith(
        lectureId,
        expect.anything()
      );
    });

    it('should handle internal server errors', async () => {
      const lectureId = 'error-trigger';

      // Specifically mock the error case
      jest.spyOn(LecturePrerequisiteController, 'getPrerequisitesForLecture').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {}
      );

      // Execute the handler
      const response = await GET(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/lectures/:id/prerequisites', () => {
    it('should add a prerequisite to a lecture', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteData = {
        prerequisiteLectureId: 'lecture-2',
        isRequired: true,
        importanceLevel: 4
      };

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prerequisiteData)
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data.message).toBe('Prerequisite added successfully');
      expect(data.data).toBeDefined();
      expect(LecturePrerequisiteController.addPrerequisite).toHaveBeenCalledWith({
        lectureId,
        ...prerequisiteData
      });
    });

    it('should return 400 if lecture ID is missing', async () => {
      // Create mock request with missing ID
      const mockRequest = new NextRequest(
        new URL('https://example.com/api/lectures//prerequisites'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prerequisiteLectureId: 'lecture-2' })
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: '' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Lecture ID is required');
      expect(LecturePrerequisiteController.addPrerequisite).not.toHaveBeenCalled();
    });

    it('should return 400 if prerequisite lecture ID is missing', async () => {
      const lectureId = 'lecture-1';

      // Create mock request without prerequisiteLectureId
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isRequired: true })
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Prerequisite lecture ID is required');
      expect(LecturePrerequisiteController.addPrerequisite).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const lectureId = 'lecture-1';

      // Mock session to return null (unauthenticated)
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prerequisiteLectureId: 'lecture-2' })
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LecturePrerequisiteController.addPrerequisite).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have sufficient permissions', async () => {
      const lectureId = 'lecture-1';

      // Mock session to return a non-admin/non-instructor user
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'user-2',
          email: 'student@example.com',
          name: 'Student User',
          role: USER_ROLES.STUDENT
        }
      });

      // Mock user role lookup to return STUDENT role
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        role: USER_ROLES.STUDENT
      });

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prerequisiteLectureId: 'lecture-2' })
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - insufficient permissions');
      expect(LecturePrerequisiteController.addPrerequisite).not.toHaveBeenCalled();
    });

    it('should return 400 for circular dependency errors', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteData = {
        prerequisiteLectureId: 'circular-dependency-id',
        isRequired: true,
        importanceLevel: 4
      };

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prerequisiteData)
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Adding this prerequisite would create a circular dependency');
      expect(data.cycleDetails).toBeDefined();
      expect(data.cycleDetails.path).toHaveLength(4); // The cycle path
      expect(LecturePrerequisiteController.addPrerequisite).toHaveBeenCalled();
    });

    it('should return 409 for duplicate prerequisites', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteData = {
        prerequisiteLectureId: 'duplicate-prerequisite-id',
        isRequired: true,
        importanceLevel: 3
      };

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prerequisiteData)
        }
      );

      // Execute the handler
      const response = await POST(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(409);
      expect(data.error).toBe('This prerequisite relationship already exists');
      expect(data.existingId).toBe('existing-prereq-id');
      expect(LecturePrerequisiteController.addPrerequisite).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/lectures/:id/prerequisites', () => {
    it('should remove a prerequisite from a lecture', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteId = 'prereq-1';

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?prerequisiteId=${prerequisiteId}`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.message).toBe('Prerequisite removed successfully');
      expect(LecturePrerequisiteController.removePrerequisite).toHaveBeenCalledWith(prerequisiteId);
    });

    it('should return 400 if lecture ID is missing', async () => {
      const prerequisiteId = 'prereq-1';

      // Create mock request with missing lecture ID
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures//prerequisites?prerequisiteId=${prerequisiteId}`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: '' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Lecture ID is required');
      expect(LecturePrerequisiteController.removePrerequisite).not.toHaveBeenCalled();
    });

    it('should return 400 if prerequisite ID is missing', async () => {
      const lectureId = 'lecture-1';

      // Create mock request without prerequisiteId
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Prerequisite ID is required as a query parameter');
      expect(LecturePrerequisiteController.removePrerequisite).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteId = 'prereq-1';

      // Mock session to return null (unauthenticated)
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?prerequisiteId=${prerequisiteId}`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LecturePrerequisiteController.removePrerequisite).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have sufficient permissions', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteId = 'prereq-1';

      // Mock session to return a non-admin/non-instructor user
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: {
          id: 'user-2',
          email: 'student@example.com',
          name: 'Student User',
          role: USER_ROLES.STUDENT
        }
      });

      // Mock user role lookup to return STUDENT role
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        role: USER_ROLES.STUDENT
      });

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?prerequisiteId=${prerequisiteId}`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden - insufficient permissions');
      expect(LecturePrerequisiteController.removePrerequisite).not.toHaveBeenCalled();
    });

    it('should return 404 if prerequisite not found', async () => {
      const lectureId = 'lecture-1';
      const prerequisiteId = 'non-existent-prereq-id';

      // Create mock request
      const mockRequest = new NextRequest(
        new URL(`https://example.com/api/lectures/${lectureId}/prerequisites?prerequisiteId=${prerequisiteId}`),
        { method: 'DELETE' }
      );

      // Execute the handler
      const response = await DELETE(mockRequest, { params: { id: lectureId } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe(`Prerequisite with ID ${prerequisiteId} not found`);
      expect(LecturePrerequisiteController.removePrerequisite).toHaveBeenCalledWith(prerequisiteId);
    });
  });
});
