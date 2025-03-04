// tests/api/philosophical-entities.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { USER_ROLES } from '@/lib/constants';

// Import the actual modules first
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';
import { getServerSession } from 'next-auth/next';

// Then import the handlers that use these modules
import { GET as getEntitiesHandler, POST as createEntityHandler } from '@/app/api/philosophical-entities/route';
import {
  GET as getEntityByIdHandler,
  PATCH as updateEntityHandler,
  DELETE as deleteEntityHandler
} from '@/app/api/philosophical-entities/[id]/route';
import { GET as getRelationshipsHandler } from '@/app/api/philosophical-entities/[id]/relationships/route';
import { GET as getLearningPathHandler } from '@/app/api/philosophical-entities/[id]/learning-path/route';

describe('Philosophical Entities API Endpoints', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock the session for authorized requests by default
    jest.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: USER_ROLES.ADMIN
      }
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GET /api/philosophical-entities
  //////////////////////////////////////////////////////////////////////////////

  describe('GET /api/philosophical-entities', () => {
    it('should return a list of entities with pagination', async () => {
      // Mock data
      const mockEntities = [
        { id: 'entity-1', name: 'Test Entity 1', type: 'Philosopher', description: 'Description 1' },
        { id: 'entity-2', name: 'Test Entity 2', type: 'PhilosophicalConcept', description: 'Description 2' }
      ];

      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      // Mock the controller method using spyOn
      jest.spyOn(PhilosophicalEntityController, 'getAllEntities').mockResolvedValue({
        success: true,
        data: mockEntities,
        pagination: mockPagination
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities');

      // Call the handler
      const response = await getEntitiesHandler(req);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(data.data).toEqual(mockEntities);
      expect(data.pagination).toEqual(mockPagination);
      expect(PhilosophicalEntityController.getAllEntities).toHaveBeenCalledTimes(1);
      expect(PhilosophicalEntityController.getAllEntities).toHaveBeenCalledWith({
        type: undefined,
        search: undefined,
        page: 1,
        limit: 10
      });
    });

    it('should apply filters and pagination from query parameters', async () => {
      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'getAllEntities').mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 2, limit: 5, totalPages: 0 }
      });

      // Create mock request with query parameters
      const req = new NextRequest(
        'http://localhost:3000/api/philosophical-entities?type=Philosopher&search=plato&page=2&limit=5'
      );

      // Call the handler
      await getEntitiesHandler(req);

      // Assert correct parameters were passed to controller
      expect(PhilosophicalEntityController.getAllEntities).toHaveBeenCalledWith({
        type: 'Philosopher',
        search: 'plato',
        page: 2,
        limit: 5
      });
    });

    it('should handle controller errors gracefully', async () => {
      // Mock error response
      jest.spyOn(PhilosophicalEntityController, 'getAllEntities').mockResolvedValue({
        success: false,
        error: 'Database connection error'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities');

      // Call the handler
      const response = await getEntitiesHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Database connection error');
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // POST /api/philosophical-entities
  //////////////////////////////////////////////////////////////////////////////

  describe('POST /api/philosophical-entities', () => {
    it('should create a new entity when authenticated as admin', async () => {
      // Mock entity data
      const mockEntityData = {
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher',
        birthplace: 'Königsberg'
      };

      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'createEntity').mockResolvedValue({
        success: true,
        data: { id: 'new-entity-id', ...mockEntityData, createdAt: new Date(), updatedAt: new Date() }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntityData)
      });

      // Call the handler
      const response = await createEntityHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'new-entity-id');
      expect(data).toHaveProperty('name', 'Immanuel Kant');
      expect(PhilosophicalEntityController.createEntity).toHaveBeenCalledWith(mockEntityData);
    });

    it('should reject creation with missing required fields', async () => {
      // Mock entity data with missing required fields
      const mockEntityData = {
        type: 'Philosopher',
        // missing name
        description: 'German philosopher'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntityData)
      });

      // Call the handler
      const response = await createEntityHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('required fields');
      expect(PhilosophicalEntityController.createEntity).not.toHaveBeenCalled();
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Mock entity data
      const mockEntityData = {
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntityData)
      });

      // Call the handler
      const response = await createEntityHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalEntityController.createEntity).not.toHaveBeenCalled();
    });

    it('should reject requests from users with insufficient permissions', async () => {
      // Mock session with STUDENT role
      jest.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: 'student-id',
          name: 'Student User',
          email: 'student@example.com',
          role: USER_ROLES.STUDENT
        }
      });

      // Mock entity data
      const mockEntityData = {
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntityData)
      });

      // Call the handler
      const response = await createEntityHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('insufficient permissions');
      expect(PhilosophicalEntityController.createEntity).not.toHaveBeenCalled();
    });

    it('should handle controller errors during entity creation', async () => {
      // Mock entity data
      const mockEntityData = {
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher'
      };

      // Mock controller error
      jest.spyOn(PhilosophicalEntityController, 'createEntity').mockResolvedValue({
        success: false,
        error: 'Invalid entity type'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntityData)
      });

      // Call the handler
      const response = await createEntityHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid entity type');
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GET /api/philosophical-entities/[id]
  //////////////////////////////////////////////////////////////////////////////

  describe('GET /api/philosophical-entities/[id]', () => {
    it('should return an entity by ID', async () => {
      // Mock entity data
      const mockEntity = {
        id: 'entity-id',
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher',
        relationships: []
      };

      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'getEntityById').mockResolvedValue({
        success: true,
        data: mockEntity
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id');

      // Call the handler
      const response = await getEntityByIdHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockEntity);
      expect(PhilosophicalEntityController.getEntityById).toHaveBeenCalledWith('entity-id');
    });

    it('should return 404 when entity is not found', async () => {
      // Mock not found response
      jest.spyOn(PhilosophicalEntityController, 'getEntityById').mockResolvedValue({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/nonexistent-id');

      // Call the handler
      const response = await getEntityByIdHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Entity not found');
    });

    it('should return 400 when ID parameter is missing', async () => {
      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/');

      // Call the handler with empty params
      const response = await getEntityByIdHandler(req, { params: { id: '' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Entity ID is required');
      expect(PhilosophicalEntityController.getEntityById).not.toHaveBeenCalled();
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // PATCH /api/philosophical-entities/[id]
  //////////////////////////////////////////////////////////////////////////////

  describe('PATCH /api/philosophical-entities/[id]', () => {
    it('should update an entity when authenticated as admin', async () => {
      // Mock update data
      const mockUpdateData = {
        description: 'Updated description',
        birthplace: 'Updated birthplace'
      };

      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'updateEntity').mockResolvedValue({
        success: true,
        data: {
          id: 'entity-id',
          type: 'Philosopher',
          name: 'Immanuel Kant',
          description: 'Updated description',
          birthplace: 'Updated birthplace'
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('description', 'Updated description');
      expect(PhilosophicalEntityController.updateEntity).toHaveBeenCalledWith('entity-id', mockUpdateData);
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Mock update data
      const mockUpdateData = { description: 'Updated description' };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalEntityController.updateEntity).not.toHaveBeenCalled();
    });

    it('should reject requests with insufficient permissions', async () => {
      // Mock session with STUDENT role
      jest.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: 'student-id',
          name: 'Student User',
          email: 'student@example.com',
          role: USER_ROLES.STUDENT
        }
      });

      // Mock update data
      const mockUpdateData = { description: 'Updated description' };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('insufficient permissions');
      expect(PhilosophicalEntityController.updateEntity).not.toHaveBeenCalled();
    });

    it('should return 404 when entity to update is not found', async () => {
      // Mock update data
      const mockUpdateData = { description: 'Updated description' };

      // Mock not found response
      jest.spyOn(PhilosophicalEntityController, 'updateEntity').mockResolvedValue({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/nonexistent-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateEntityHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Entity not found');
    });

    it('should reject empty update requests', async () => {
      // Empty update data
      const mockUpdateData = {};

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'No update data provided');
      expect(PhilosophicalEntityController.updateEntity).not.toHaveBeenCalled();
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // DELETE /api/philosophical-entities/[id]
  //////////////////////////////////////////////////////////////////////////////

  describe('DELETE /api/philosophical-entities/[id]', () => {
    it('should delete an entity when authenticated as admin', async () => {
      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'deleteEntity').mockResolvedValue({
        success: true,
        message: 'Entity deleted successfully'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Entity deleted successfully');
      expect(PhilosophicalEntityController.deleteEntity).toHaveBeenCalledWith('entity-id');
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalEntityController.deleteEntity).not.toHaveBeenCalled();
    });

    it('should reject requests from non-admin users', async () => {
      // Even instructors cannot delete entities, only admins
      jest.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: 'instructor-id',
          name: 'Instructor User',
          email: 'instructor@example.com',
          role: USER_ROLES.INSTRUCTOR
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteEntityHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('admin access required');
      expect(PhilosophicalEntityController.deleteEntity).not.toHaveBeenCalled();
    });

    it('should return 404 when entity to delete is not found', async () => {
      // Mock not found response
      jest.spyOn(PhilosophicalEntityController, 'deleteEntity').mockResolvedValue({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/nonexistent-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteEntityHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Entity not found');
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GET /api/philosophical-entities/[id]/relationships
  //////////////////////////////////////////////////////////////////////////////

  describe('GET /api/philosophical-entities/[id]/relationships', () => {
    it('should return relationships for an entity', async () => {
      // Mock relationships data
      const mockRelationships = [
        {
          id: 'relation-1',
          sourceEntityId: 'entity-id',
          targetEntityId: 'target-id',
          relationTypes: ['DEVELOPMENT'],
          description: 'Developed by',
          direction: 'outgoing',
          relatedEntity: { id: 'target-id', name: 'Target Entity' }
        }
      ];

      // Mock successful response
      jest.spyOn(PhilosophicalRelationController, 'getRelationshipsByEntityId').mockResolvedValue({
        success: true,
        data: mockRelationships
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-id/relationships');

      // Call the handler
      const response = await getRelationshipsHandler(req, { params: { id: 'entity-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockRelationships);
      expect(PhilosophicalRelationController.getRelationshipsByEntityId).toHaveBeenCalledWith('entity-id');
    });

    it('should return 404 when entity is not found', async () => {
      // Mock not found response
      jest.spyOn(PhilosophicalRelationController, 'getRelationshipsByEntityId').mockResolvedValue({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/nonexistent-id/relationships');

      // Call the handler
      const response = await getRelationshipsHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Entity not found');
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GET /api/philosophical-entities/[id]/learning-path
  //////////////////////////////////////////////////////////////////////////////

  describe('GET /api/philosophical-entities/[id]/learning-path', () => {
    it('should return a learning path to a target concept', async () => {
      // Mock learning path data
      const mockLearningPath = [
        { id: 'concept-basic', name: 'Basic Concept', type: 'PhilosophicalConcept' },
        { id: 'concept-intermediate', name: 'Intermediate Concept', type: 'PhilosophicalConcept' },
        { id: 'concept-target', name: 'Target Concept', type: 'PhilosophicalConcept' }
      ];

      // Mock successful response
      jest.spyOn(PhilosophicalEntityController, 'getLearningPath').mockResolvedValue({
        success: true,
        data: mockLearningPath
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/concept-target/learning-path');

      // Call the handler
      const response = await getLearningPathHandler(req, { params: { id: 'concept-target' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockLearningPath);
      expect(PhilosophicalEntityController.getLearningPath).toHaveBeenCalledWith('concept-target');
    });

    it('should return 404 when target concept is not found', async () => {
      // Mock not found response
      jest.spyOn(PhilosophicalEntityController, 'getLearningPath').mockResolvedValue({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/nonexistent-id/learning-path');

      // Call the handler
      const response = await getLearningPathHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Entity not found');
    });
  });
});
