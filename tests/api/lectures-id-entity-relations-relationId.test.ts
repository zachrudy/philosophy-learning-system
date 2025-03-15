// tests/api/lectures-id-entity-relations-relationId.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '@/app/api/lectures/[id]/entity-relations/[relationId]/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock the prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    lectureEntityRelation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Lecture Entity Relations RelationId API Routes', () => {
  // Define common variables
  const lectureId = 'lecture-1';
  const relationId = 'relation-1';
  const entityId = 'entity-plato-id';

  beforeEach(() => {
    jest.clearAllMocks();

    // Explicitly setup the prisma mocks to avoid undefined issues
    prisma.lectureEntityRelation = {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    prisma.user.findUnique = jest.fn();

    // Mock a successful auth session by default
    getServerSession.mockResolvedValue({
      user: { email: 'admin@example.com', role: 'ADMIN' }
    });

    // Mock a successful role lookup by default
    prisma.user.findUnique.mockResolvedValue({
      role: 'ADMIN'
    });
  });

  describe('PATCH /api/lectures/:id/entity-relations/:relationId', () => {
    it('should update a specific entity relation when user is authorized', async () => {
      // Setup mock relation data
      const originalRelation = {
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      };

      const updatedRelation = {
        ...originalRelation,
        relationType: 'expands' // Changed relation type
      };

      // Mock the findUnique to find the existing relation
      prisma.lectureEntityRelation.findUnique.mockResolvedValue(originalRelation);

      // Mock the update to return the updated relation
      prisma.lectureEntityRelation.update.mockResolvedValue({
        ...updatedRelation,
        entity: {
          id: entityId,
          name: 'Plato',
          type: 'Philosopher'
        }
      });

      // Create mock request with updated data
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Entity relationship updated successfully');
      expect(responseData.data).toHaveProperty('relationType', 'expands');
      expect(prisma.lectureEntityRelation.update).toHaveBeenCalledWith({
        where: { id: relationId },
        data: { relationType: 'expands' },
        include: { entity: true }
      });
    });

    it('should reject update when user is not authenticated', async () => {
      // Override default auth mock to simulate unauthenticated user
      getServerSession.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should reject update when user is not authorized', async () => {
      // Override default role mock to simulate student user
      prisma.user.findUnique.mockResolvedValue({
        role: 'STUDENT'
      });

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should return 404 when relation is not found', async () => {
      // Mock the findUnique to return null (relation not found)
      prisma.lectureEntityRelation.findUnique.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Entity relationship not found');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should return 403 when relation does not belong to the lecture', async () => {
      // Mock the findUnique to return a relation with different lectureId
      const differentLectureId = 'different-lecture-id';
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId: differentLectureId, // Different from the requested lecture
        entityId,
        relationType: 'introduces'
      });

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Entity relationship does not belong to the specified lecture');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should reject update with empty body', async () => {
      // Setup mock relation data
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      });

      // Create mock request with empty body
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // Empty body
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'No update data provided');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should validate relation type', async () => {
      // Setup mock relation data
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      });

      // Create mock request with invalid relation type
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'invalid_type' // Invalid relation type
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid relation type: invalid_type');
      expect(responseData).toHaveProperty('validTypes');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in request body', async () => {
      // We can't easily simulate invalid JSON with the NextRequest mock,
      // so let's simulate the behavior directly by making the json() method throw an error
      const mockRequest = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Override the json method to throw an error
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      // Execute the route handler
      const response = await PATCH(
        mockRequest,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid JSON in request body');
      expect(prisma.lectureEntityRelation.update).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      // Setup mock relation data
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      });

      // Mock update to throw an error
      prisma.lectureEntityRelation.update.mockRejectedValue(new Error('Database error'));

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            relationType: 'expands'
          })
        }
      );

      // Execute the route handler
      const response = await PATCH(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('DELETE /api/lectures/:id/entity-relations/:relationId', () => {
    it('should delete a specific entity relation when user is authorized', async () => {
      // Setup mock relation data
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      });

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Entity relationship removed successfully');
      expect(prisma.lectureEntityRelation.delete).toHaveBeenCalledWith({
        where: { id: relationId }
      });
    });

    it('should reject deletion when user is not authenticated', async () => {
      // Override default auth mock to simulate unauthenticated user
      getServerSession.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should reject deletion when user is not authorized', async () => {
      // Override default role mock to simulate student user
      prisma.user.findUnique.mockResolvedValue({
        role: 'STUDENT'
      });

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should return 404 when relation is not found', async () => {
      // Mock the findUnique to return null (relation not found)
      prisma.lectureEntityRelation.findUnique.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Entity relationship not found');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should return 403 when relation does not belong to the lecture', async () => {
      // Mock the findUnique to return a relation with different lectureId
      const differentLectureId = 'different-lecture-id';
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId: differentLectureId, // Different from the requested lecture
        entityId,
        relationType: 'introduces'
      });

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Entity relationship does not belong to the specified lecture');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should handle internal server errors during deletion', async () => {
      // Setup mock relation data
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId,
        relationType: 'introduces'
      });

      // Mock delete to throw an error
      prisma.lectureEntityRelation.delete.mockRejectedValue(new Error('Database error'));

      // Create mock request
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations/${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(
        request,
        { params: { id: lectureId, relationId } }
      );
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Internal server error');
    });
  });
});
