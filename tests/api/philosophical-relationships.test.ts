// tests/api/philosophical-relationships.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { USER_ROLES } from '@/lib/constants';

// Import the actual modules
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';
import { getServerSession } from 'next-auth/next';

// Import the route handlers
import { POST as createRelationshipHandler } from '@/app/api/philosophical-relationships/route';
import {
  PATCH as updateRelationshipHandler,
  DELETE as deleteRelationshipHandler
} from '@/app/api/philosophical-relationships/[id]/route';

describe('Philosophical Relationships API Endpoints', () => {
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
  // POST /api/philosophical-relationships
  //////////////////////////////////////////////////////////////////////////////

  describe('POST /api/philosophical-relationships', () => {
    it('should create a relationship when authenticated as admin', async () => {
      // Mock relationship data
      const mockRelationshipData = {
        sourceEntityId: 'philosopher-id',
        targetEntityId: 'concept-id',
        relationTypes: ['DEVELOPMENT'],
        description: 'Kant developed the categorical imperative',
        importance: 5
      };

      // Mock successful response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'createRelationship').mockResolvedValue({
        success: true,
        data: {
          id: 'relation-id',
          ...mockRelationshipData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRelationshipData)
      });

      // Call the handler
      const response = await createRelationshipHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'relation-id');
      expect(data).toHaveProperty('sourceEntityId', 'philosopher-id');
      expect(data).toHaveProperty('targetEntityId', 'concept-id');
      expect(PhilosophicalRelationController.createRelationship).toHaveBeenCalledWith(mockRelationshipData);
    });

    it('should reject creation with missing required fields', async () => {
      // Mock relationship data with missing required fields
      const mockRelationshipData = {
        sourceEntityId: 'philosopher-id',
        targetEntityId: 'concept-id',
        // missing relationTypes array
        description: 'Kant developed the categorical imperative'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRelationshipData)
      });

      // Call the handler
      const response = await createRelationshipHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('relationTypes');
      expect(PhilosophicalRelationController.createRelationship).not.toHaveBeenCalled();
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Mock relationship data
      const mockRelationshipData = {
        sourceEntityId: 'philosopher-id',
        targetEntityId: 'concept-id',
        relationTypes: ['DEVELOPMENT'],
        description: 'Test description'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRelationshipData)
      });

      // Call the handler
      const response = await createRelationshipHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalRelationController.createRelationship).not.toHaveBeenCalled();
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

      // Mock relationship data
      const mockRelationshipData = {
        sourceEntityId: 'philosopher-id',
        targetEntityId: 'concept-id',
        relationTypes: ['DEVELOPMENT'],
        description: 'Test description'
      };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRelationshipData)
      });

      // Call the handler
      const response = await createRelationshipHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('insufficient permissions');
      expect(PhilosophicalRelationController.createRelationship).not.toHaveBeenCalled();
    });

    it('should handle controller errors during relationship creation', async () => {
      // Mock relationship data
      const mockRelationshipData = {
        sourceEntityId: 'philosopher-id',
        targetEntityId: 'concept-id',
        relationTypes: ['DEVELOPMENT'],
        description: 'Test description'
      };

      // Mock controller error - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'createRelationship').mockResolvedValue({
        success: false,
        error: 'Invalid relationship: source entity not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRelationshipData)
      });

      // Call the handler
      const response = await createRelationshipHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid relationship');
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // PATCH /api/philosophical-relationships/[id]
  //////////////////////////////////////////////////////////////////////////////

  describe('PATCH /api/philosophical-relationships/[id]', () => {
    it('should update a relationship when authenticated as admin', async () => {
      // Mock update data
      const mockUpdateData = {
        description: 'Updated relationship description',
        importance: 4,
        relationTypes: ['LOGICAL_CONNECTION']
      };

      // Mock successful response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'updateRelationship').mockResolvedValue({
        success: true,
        data: {
          id: 'relation-id',
          sourceEntityId: 'source-id',
          targetEntityId: 'target-id',
          relationTypes: ['LOGICAL_CONNECTION'],
          description: 'Updated relationship description',
          importance: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('description', 'Updated relationship description');
      expect(data).toHaveProperty('importance', 4);
      expect(data).toHaveProperty('relationTypes');
      expect(data.relationTypes).toEqual(['LOGICAL_CONNECTION']);
      expect(PhilosophicalRelationController.updateRelationship).toHaveBeenCalledWith('relation-id', mockUpdateData);
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Mock update data
      const mockUpdateData = { description: 'Updated description' };

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalRelationController.updateRelationship).not.toHaveBeenCalled();
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
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('insufficient permissions');
      expect(PhilosophicalRelationController.updateRelationship).not.toHaveBeenCalled();
    });

    it('should return 404 when relationship to update is not found', async () => {
      // Mock update data
      const mockUpdateData = { description: 'Updated description' };

      // Mock not found response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'updateRelationship').mockResolvedValue({
        success: false,
        error: 'Relationship not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/nonexistent-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateRelationshipHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Relationship not found');
    });

    it('should reject empty update requests', async () => {
      // Empty update data
      const mockUpdateData = {};

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData)
      });

      // Call the handler
      const response = await updateRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'No update data provided');
      expect(PhilosophicalRelationController.updateRelationship).not.toHaveBeenCalled();
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // DELETE /api/philosophical-relationships/[id]
  //////////////////////////////////////////////////////////////////////////////

  describe('DELETE /api/philosophical-relationships/[id]', () => {
    it('should delete a relationship when authenticated as admin', async () => {
      // Mock successful response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'deleteRelationship').mockResolvedValue({
        success: true,
        message: 'Relationship deleted successfully'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Relationship deleted successfully');
      expect(PhilosophicalRelationController.deleteRelationship).toHaveBeenCalledWith('relation-id');
    });

    it('should allow instructors to delete relationships', async () => {
      // Mock session with INSTRUCTOR role
      jest.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: 'instructor-id',
          name: 'Instructor User',
          email: 'instructor@example.com',
          role: USER_ROLES.INSTRUCTOR
        }
      });

      // Mock successful response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'deleteRelationship').mockResolvedValue({
        success: true,
        message: 'Relationship deleted successfully'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Relationship deleted successfully');
      expect(PhilosophicalRelationController.deleteRelationship).toHaveBeenCalledWith('relation-id');
    });

    it('should reject unauthorized requests', async () => {
      // Mock unauthenticated session
      jest.mocked(getServerSession).mockResolvedValueOnce(null);

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
      expect(PhilosophicalRelationController.deleteRelationship).not.toHaveBeenCalled();
    });

    it('should reject requests from student users', async () => {
      // Mock session with STUDENT role
      jest.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: 'student-id',
          name: 'Student User',
          email: 'student@example.com',
          role: USER_ROLES.STUDENT
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('insufficient permissions');
      expect(PhilosophicalRelationController.deleteRelationship).not.toHaveBeenCalled();
    });

    it('should return 404 when relationship to delete is not found', async () => {
      // Mock not found response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'deleteRelationship').mockResolvedValue({
        success: false,
        error: 'Relationship not found'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/nonexistent-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Relationship not found');
    });

    it('should handle database errors during deletion', async () => {
      // Mock error response - FIXED to use PhilosophicalRelationController
      jest.spyOn(PhilosophicalRelationController, 'deleteRelationship').mockResolvedValue({
        success: false,
        error: 'Failed to delete relationship: Database error'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-relationships/relation-id', {
        method: 'DELETE'
      });

      // Call the handler
      const response = await deleteRelationshipHandler(req, { params: { id: 'relation-id' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to delete relationship');
    });
  });
});
