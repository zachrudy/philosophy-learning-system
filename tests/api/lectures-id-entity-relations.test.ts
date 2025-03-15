// tests/api/lectures-id-entity-relations.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getLectureEntityRelations, POST, DELETE } from '@/app/api/lectures/[id]/entity-relations/route';
import { LectureController } from '@/controllers/lectureController';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';

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
      delete: jest.fn()
    }
  }
}));

// Mock the controllers
jest.mock('@/controllers/lectureController');

describe('Lecture Entity Relations API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup controller mock methods
    jest.spyOn(LectureController, 'getLectureEntityRelations').mockImplementation(jest.fn());
    jest.spyOn(LectureController, 'updateEntityRelationships').mockImplementation(jest.fn());

    // Explicitly setup the prisma mocks for lectureEntityRelation
    prisma.lectureEntityRelation = {
      findUnique: jest.fn(),
      delete: jest.fn()
    };
  });

  describe('GET /api/lectures/:id/entity-relations', () => {
    it('should return entity relations for a specific lecture', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockEntityRelations = [
        {
          id: 'relation-1',
          lectureId,
          entityId: 'entity-plato-id',
          relationType: 'introduces',
          entity: {
            id: 'entity-plato-id',
            name: 'Plato',
            type: 'Philosopher'
          }
        },
        {
          id: 'relation-2',
          lectureId,
          entityId: 'entity-forms-id',
          relationType: 'expands',
          entity: {
            id: 'entity-forms-id',
            name: 'Theory of Forms',
            type: 'PhilosophicalConcept'
          }
        }
      ];

      // Setup mock response from controller
      (LectureController.getLectureEntityRelations as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEntityRelations,
        metadata: {
          count: mockEntityRelations.length,
          lectureId
        }
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`);

      // Execute the route handler
      const response = await getLectureEntityRelations(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toEqual(mockEntityRelations);
      expect(responseData).toHaveProperty('metadata');
      expect(responseData.metadata).toHaveProperty('count', 2);
      expect(LectureController.getLectureEntityRelations).toHaveBeenCalledWith(lectureId);
    });

    it('should handle lecture not found error', async () => {
      // Setup mock response from controller for a lecture not found scenario
      const nonExistentId = 'non-existent-id';
      (LectureController.getLectureEntityRelations as jest.Mock).mockResolvedValue({
        success: false,
        error: `Lecture with ID ${nonExistentId} not found`,
        statusCode: 404
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${nonExistentId}/entity-relations`);

      // Execute the route handler
      const response = await getLectureEntityRelations(request, { params: { id: nonExistentId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', `Lecture with ID ${nonExistentId} not found`);
      expect(LectureController.getLectureEntityRelations).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle server errors', async () => {
      // Setup mock response from controller for a server error
      const lectureId = 'lecture-1';
      (LectureController.getLectureEntityRelations as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Internal server error occurred',
        statusCode: 500
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`);

      // Execute the route handler
      const response = await getLectureEntityRelations(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Internal server error occurred');
      expect(LectureController.getLectureEntityRelations).toHaveBeenCalledWith(lectureId);
    });
  });

  // POST tests
  describe('POST /api/lectures/:id/entity-relations', () => {
    // Setup reused variables
    const lectureId = 'lecture-1';
    const validEntityRelations = [
      {
        entityId: 'entity-plato-id',
        relationType: 'introduces'
      },
      {
        entityId: 'entity-forms-id',
        relationType: 'expands'
      }
    ];

    it('should add entity relations when user is authorized', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock entity relations with IDs added (as would happen in the DB)
      const createdRelations = validEntityRelations.map((rel, index) => ({
        id: `relation-${index+1}`,
        lectureId,
        ...rel,
        entity: {
          id: rel.entityId,
          name: rel.entityId.replace('entity-', '').replace('-id', ''),
          type: rel.entityId.includes('plato') ? 'Philosopher' : 'PhilosophicalConcept'
        }
      }));

      // Setup mock response from controller
      (LectureController.updateEntityRelationships as jest.Mock).mockResolvedValue({
        success: true,
        data: createdRelations,
        metadata: {
          count: createdRelations.length,
          lectureId
        }
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validEntityRelations)
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('message', 'Entity relationships updated successfully');
      expect(responseData).toHaveProperty('data', createdRelations);
      expect(LectureController.updateEntityRelationships).toHaveBeenCalledWith(
        lectureId,
        validEntityRelations.map(rel => ({ ...rel, lectureId }))
      );
    });

    it('should reject update when user is not authenticated', async () => {
      // Setup session as unauthenticated
      getServerSession.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validEntityRelations)
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
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
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validEntityRelations)
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
    });

    it('should validate that request body is an array', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Create mock request with invalid (non-array) data
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entityId: 'entity-1', relationType: 'introduces' }) // Not an array
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Request body must be an array of entity relations');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
    });

    it('should validate that each entity relation has required fields', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Create mock request with invalid data (missing relationType)
      const invalidEntityRelations = [
        {
          entityId: 'entity-plato-id'
          // Missing relationType
        }
      ];

      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidEntityRelations)
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Relation type is required for relation at index 0');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
    });

    it('should validate relation types', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Create mock request with invalid relation type
      const invalidEntityRelations = [
        {
          entityId: 'entity-plato-id',
          relationType: 'invalid_type' // Invalid relation type
        }
      ];

      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidEntityRelations)
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', "Invalid relation type 'invalid_type' for relation at index 0");
      expect(responseData).toHaveProperty('validTypes');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
    });

    it('should handle controller validation errors', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Setup mock validation error from controller
      (LectureController.updateEntityRelationships as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Entity with ID entity-nonexistent-id not found',
        statusCode: 404,
        invalidFields: {
          entityId: 'Entity not found'
        }
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          entityId: 'entity-nonexistent-id',
          relationType: 'introduces'
        }])
      });

      // Execute the route handler
      const response = await POST(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Entity with ID entity-nonexistent-id not found');
      expect(responseData).toHaveProperty('invalidFields');
      expect(LectureController.updateEntityRelationships).toHaveBeenCalled();
    });
  });

  // Delete tests
  describe('DELETE /api/lectures/:id/entity-relations', () => {
    // Setup reused variables
    const lectureId = 'lecture-1';

    it('should remove all entity relations when user is authorized and no relationId is provided', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Setup mock response from controller
      (LectureController.updateEntityRelationships as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Entity relationships removed successfully',
        metadata: {
          count: 0,
          lectureId
        }
      });

      // Create mock request (without a relationId query param)
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Entity relationships removed successfully');
      // Check that updateEntityRelationships was called with an empty array (to delete all)
      expect(LectureController.updateEntityRelationships).toHaveBeenCalledWith(lectureId, []);
    });

    it('should remove a specific entity relation when relationId is provided', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock relation data
      const relationId = 'relation-1';

      // Mock prisma responses
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId: 'entity-1',
        relationType: 'introduces'
      });

      prisma.lectureEntityRelation.delete.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId: 'entity-1',
        relationType: 'introduces'
      });

      // Create mock request with relationId query param
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations?relationId=${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Entity relationship removed successfully');
      expect(prisma.lectureEntityRelation.delete).toHaveBeenCalledWith({
        where: { id: relationId }
      });
      // Ensure updateEntityRelationships was NOT called (since we're deleting a specific relation)
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
    });

    it('should return 404 when relation is not found', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock relation data - return null to simulate not found
      const relationId = 'nonexistent-relation';
      prisma.lectureEntityRelation.findUnique.mockResolvedValue(null);

      // Create mock request with relationId query param
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations?relationId=${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Entity relationship not found');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should return 403 when relation does not belong to the lecture', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock relation data - return a relation with different lectureId
      const relationId = 'relation-1';
      const differentLectureId = 'different-lecture-id';
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId: differentLectureId, // Different from the one in the request
        entityId: 'entity-1',
        relationType: 'introduces'
      });

      // Create mock request with relationId query param
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations?relationId=${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Entity relationship does not belong to the specified lecture');
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should reject deletion when user is not authenticated', async () => {
      // Setup session as unauthenticated
      getServerSession.mockResolvedValue(null);

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should reject deletion when user is not authorized', async () => {
      // Setup user session with student role
      getServerSession.mockResolvedValue({
        user: { email: 'student@example.com', role: 'STUDENT' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'STUDENT'
      });

      // Create mock request
      const request = new NextRequest(`http://localhost/api/lectures/${lectureId}/entity-relations`, {
        method: 'DELETE'
      });

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toHaveProperty('error', 'Forbidden - insufficient permissions');
      expect(LectureController.updateEntityRelationships).not.toHaveBeenCalled();
      expect(prisma.lectureEntityRelation.delete).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      // Setup user session with admin role
      getServerSession.mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }
      });

      // Setup database role lookup
      prisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN'
      });

      // Mock relation data
      const relationId = 'relation-1';
      prisma.lectureEntityRelation.findUnique.mockResolvedValue({
        id: relationId,
        lectureId,
        entityId: 'entity-1',
        relationType: 'introduces'
      });

      // Mock database operation throwing an error
      prisma.lectureEntityRelation.delete.mockRejectedValue(new Error('Database error'));

      // Create mock request with relationId
      const request = new NextRequest(
        `http://localhost/api/lectures/${lectureId}/entity-relations?relationId=${relationId}`,
        { method: 'DELETE' }
      );

      // Execute the route handler
      const response = await DELETE(request, { params: { id: lectureId } });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Internal server error');
    });
  });
});
