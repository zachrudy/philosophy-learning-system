// tests/api/lectures.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/lectures/route';
import { LectureController } from '@/controllers/lectureController';
import { prisma } from '@/lib/db/prisma';
import { sampleLectures } from '../fixtures/lecture-fixtures';
import { getServerSession } from 'next-auth/next';

// Mock session data
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

describe('Lectures API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Use spyOn to mock the controller methods
    jest.spyOn(LectureController, 'getAllLectures').mockImplementation(() => Promise.resolve({} as any));
    jest.spyOn(LectureController, 'createLecture').mockImplementation(() => Promise.resolve({} as any));
  });

  describe('GET /api/lectures', () => {
    it('should return lectures with pagination', async () => {
      // Arrange
      const mockLectures = sampleLectures.map((lecture, index) => ({
        id: `lecture-${index}`,
        ...lecture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const mockPagination = {
        total: mockLectures.length,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      const mockResponse = {
        success: true,
        data: mockLectures,
        metadata: {
          pagination: mockPagination,
          filters: {
            category: undefined,
            lecturerName: undefined,
            contentType: undefined,
            search: undefined
          }
        }
      };

      // Mock the controller response
      LectureController.getAllLectures.mockResolvedValue(mockResponse);

      // Create a mock request with search params
      const request = new NextRequest('http://localhost/api/lectures?page=1&limit=10');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockLectures);
      expect(responseData.pagination).toEqual(mockPagination);
      expect(LectureController.getAllLectures).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10
        })
      );
    });

    it('should handle filters correctly', async () => {
      // Arrange
      const category = 'ancient-philosophy';
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          },
          filters: {
            category,
            lecturerName: undefined,
            contentType: undefined,
            search: undefined
          }
        }
      };

      // Mock the controller response
      LectureController.getAllLectures.mockResolvedValue(mockResponse);

      // Create a mock request with category filter
      const request = new NextRequest(`http://localhost/api/lectures?category=${category}`);

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(LectureController.getAllLectures).toHaveBeenCalledWith(
        expect.objectContaining({
          category
        })
      );
    });

    it('should handle controller errors', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch lectures';
      const mockResponse = {
        success: false,
        error: errorMessage,
        statusCode: 500
      };

      // Mock the controller to return an error
      LectureController.getAllLectures.mockResolvedValue(mockResponse);

      // Create a mock request
      const request = new NextRequest('http://localhost/api/lectures');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.error).toBe(errorMessage);
    });
  });

  describe('POST /api/lectures', () => {
    it('should create a new lecture when user is authorized', async () => {
      // Arrange
      const newLecture = sampleLectures[0];
      const mockCreatedLecture = {
        id: 'new-lecture-id',
        ...newLecture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Mock session with admin role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      // Mock database lookup for user role
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: 'ADMIN'
      });

      // Mock the controller response
      LectureController.createLecture.mockResolvedValue({
        success: true,
        data: mockCreatedLecture,
        message: 'Lecture created successfully'
      });

      // Create a mock request with the lecture data
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLecture)
      });

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.data).toEqual(mockCreatedLecture);
      expect(LectureController.createLecture).toHaveBeenCalledWith(newLecture);
    });

    it('should reject creation when user is not authenticated', async () => {
      // Arrange
      const newLecture = sampleLectures[0];

      // Mock no session (unauthenticated)
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Create a mock request with the lecture data
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLecture)
      });

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
      expect(LectureController.createLecture).not.toHaveBeenCalled();
    });

    it('should reject creation when user lacks sufficient permissions', async () => {
      // Arrange
      const newLecture = sampleLectures[0];

      // Mock session with student role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'student-user-id',
          email: 'student@example.com',
          name: 'Student User',
          role: 'STUDENT'
        }
      });

      // Mock database lookup for student role
      prisma.user.findUnique.mockResolvedValue({
        id: 'student-user-id',
        role: 'STUDENT'
      });

      // Create a mock request with the lecture data
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLecture)
      });

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Forbidden - insufficient permissions');
      expect(LectureController.createLecture).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidLecture = {
        title: 'Missing Fields Lecture'
        // Missing required fields
      };

      // Mock session with admin role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      // Mock database lookup for user role
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: 'ADMIN'
      });

      // Mock the controller to return validation errors
      LectureController.createLecture.mockResolvedValue({
        success: false,
        error: 'Validation failed: Missing required fields',
        statusCode: 400,
        invalidFields: {
          description: 'Description is required',
          preLecturePrompt: 'Pre-lecture prompt is required',
          initialPrompt: 'Initial prompt is required'
        }
      });

      // Create a mock request with the invalid lecture data
      const request = new NextRequest('http://localhost/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidLecture)
      });

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed: Missing required fields');
      expect(responseData.invalidFields).toBeDefined();
      expect(LectureController.createLecture).toHaveBeenCalledWith(invalidLecture);
    });
  });
});
