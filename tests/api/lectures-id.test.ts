// tests/api/lectures-id.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getLecture, PATCH as updateLecture, DELETE as deleteLecture } from '@/app/api/lectures/[id]/route';
import { GET as getLectures, POST as createLecture } from '@/app/api/lectures/route';
import { LectureController } from '@/controllers/lectureController';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { sampleLectures } from '../fixtures/lecture-fixtures';

// Mock the controllers
jest.mock('@/controllers/lectureController');

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock the prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

describe('Lecture API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup controller mock methods for each test
    jest.spyOn(LectureController, 'getAllLectures').mockImplementation(jest.fn());
    jest.spyOn(LectureController, 'getLectureById').mockImplementation(jest.fn());
    jest.spyOn(LectureController, 'createLecture').mockImplementation(jest.fn());
    jest.spyOn(LectureController, 'updateLecture').mockImplementation(jest.fn());
    jest.spyOn(LectureController, 'deleteLecture').mockImplementation(jest.fn());
  });

  describe('GET /api/lectures', () => {
    it('should return a list of lectures', async () => {
      // Setup mock data
      const mockLectures = sampleLectures.map((lecture, index) => ({
        id: `lecture-${index}`,
        ...lecture,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Setup mock response from controller
      (LectureController.getAllLectures as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLectures,
        metadata: {
          pagination: {
            total: mockLectures.length,
            page: 1,
            limit: 10,
            totalPages: 1
          },
          filters: {}
        }
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/lectures?page=1&limit=10');

      // Execute the route handler
      const response = await getLectures(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('data');
      expect(responseData).toHaveProperty('pagination');
      expect(LectureController.getAllLectures).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });

    it('should handle controller errors', async () => {
      // Setup mock error response from controller
      (LectureController.getAllLectures as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch lectures',
        statusCode: 500
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/lectures');

      // Execute the route handler
      const response = await getLectures(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to fetch lectures');
    });
  });

  describe('GET /api/lectures/:id', () => {
    it('should return a specific lecture by ID', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup mock response from controller
      (LectureController.getLectureById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLecture
      });

      // Create mock request with URL parameters for includes
      const request = new NextRequest(
        'http://localhost/api/lectures/lecture-1?includeEntities=true&includePrerequisites=true'
      );

      // Execute the route handler
      const response = await getLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockLecture);
      expect(LectureController.getLectureById).toHaveBeenCalledWith(
        lectureId,
        expect.objectContaining({
          includeEntities: true,
          includePrerequisites: true
        })
      );
    });

    it('should handle lecture not found', async () => {
      // Setup mock response from controller
      (LectureController.getLectureById as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Lecture not found',
        statusCode: 404
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/lectures/nonexistent-id');

      // Execute the route handler
      const response = await getLecture(request, { params: { id: 'nonexistent-id' } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Lecture not found');
    });
  });

  describe('POST /api/lectures', () => {
    it('should create a new lecture when user is authorized', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock lecture data
      const newLecture = sampleLectures[0];
      const createdLecture = {
        id: 'new-lecture-id',
        ...newLecture,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup mock response from controller
      (LectureController.createLecture as jest.Mock).mockResolvedValue({
        success: true,
        data: createdLecture
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLecture)
      });

      // Execute the route handler
      const response = await createLecture(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('message', 'Lecture created successfully');
      expect(responseData).toHaveProperty('data', createdLecture);
      expect(LectureController.createLecture).toHaveBeenCalledWith(newLecture);
    });

    it('should reject creation when user is not authorized', async () => {
      // Setup user session with student role
      getServerSession.mockResolvedValue({
        user: { email: 'student@example.com', role: 'STUDENT' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'STUDENT'
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleLectures[0])
      });

      // Execute the route handler
      const response = await createLecture(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(LectureController.createLecture).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Setup mock validation error from controller
      (LectureController.createLecture as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Validation failed',
        statusCode: 400,
        invalidFields: {
          title: 'Title is required',
          description: 'Description is required'
        }
      });

      // Create mock request with invalid data
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
          contentUrl: 'https://example.com/video'
        })
      });

      // Execute the route handler
      const response = await createLecture(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Validation failed');
      expect(responseData).toHaveProperty('invalidFields');
      expect(responseData.invalidFields).toHaveProperty('title');
      expect(responseData.invalidFields).toHaveProperty('description');
    });
  });

  describe('PATCH /api/lectures/:id', () => {
    it('should update a lecture when user is authorized', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock update data and response
      const lectureId = 'lecture-1';
      const updateData = {
        title: 'Updated Lecture Title',
        description: 'Updated description'
      };
      const updatedLecture = {
        id: lectureId,
        ...sampleLectures[0],
        ...updateData,
        updatedAt: new Date()
      };

      // Setup mock response from controller
      (LectureController.updateLecture as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedLecture
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      // Execute the route handler
      const response = await updateLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Lecture updated successfully');
      expect(responseData).toHaveProperty('data', updatedLecture);
      expect(LectureController.updateLecture).toHaveBeenCalledWith(lectureId, updateData);
    });

    it('should reject update when user is not authorized', async () => {
      // Setup user session with student role
      getServerSession.mockResolvedValue({
        user: { email: 'student@example.com', role: 'STUDENT' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'STUDENT'
      });

      // Create mock request
      const lectureId = 'lecture-1';
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      });

      // Execute the route handler
      const response = await updateLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(LectureController.updateLecture).not.toHaveBeenCalled();
    });

    it('should handle circular dependency errors', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Setup mock circular dependency error from controller
      (LectureController.updateLecture as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Adding this prerequisite would create a circular dependency',
        statusCode: 400,
        cycleDetails: {
          path: ['Lecture A', 'Lecture B', 'Lecture C', 'Lecture A'],
          description: 'This would create a dependency cycle'
        }
      });

      // Create mock request with prerequisite that would create a cycle
      const lectureId = 'lecture-a';
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prerequisiteIds: [{ id: 'lecture-c' }]
        })
      });

      // Execute the route handler
      const response = await updateLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Adding this prerequisite would create a circular dependency');
      expect(responseData).toHaveProperty('cycleDetails');
      expect(responseData.cycleDetails).toHaveProperty('path');
      expect(responseData.cycleDetails.path).toContain('Lecture A');
    });
  });

  describe('DELETE /api/lectures/:id', () => {
    it('should delete a lecture when user is an admin', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock lecture ID
      const lectureId = 'lecture-1';

      // Setup mock response from controller
      (LectureController.deleteLecture as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Lecture deleted successfully'
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await deleteLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Lecture deleted successfully');
      expect(LectureController.deleteLecture).toHaveBeenCalledWith(lectureId);
    });

    it('should reject deletion for instructor role', async () => {
      // Setup user session with instructor role
      getServerSession.mockResolvedValue({
        user: { email: 'instructor@example.com', role: 'INSTRUCTOR' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'INSTRUCTOR'
      });

      // Create mock request
      const lectureId = 'lecture-1';
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await deleteLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - only administrators can delete lectures');
      expect(LectureController.deleteLecture).not.toHaveBeenCalled();
    });

    it('should handle dependency errors', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Setup mock dependency error from controller
      (LectureController.deleteLecture as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Cannot delete lecture that is a prerequisite for other lectures',
        statusCode: 400,
        dependencies: ['lecture-2', 'lecture-3']
      });

      // Create mock request
      const lectureId = 'lecture-1';
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await deleteLecture(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Cannot delete lecture that is a prerequisite for other lectures');
      expect(responseData).toHaveProperty('dependencies');
      expect(responseData.dependencies).toContain('lecture-2');
      expect(responseData.dependencies).toContain('lecture-3');
    });
  });
});
