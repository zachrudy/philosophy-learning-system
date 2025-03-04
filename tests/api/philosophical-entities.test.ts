// tests/api/philosophical-entities.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getEntitiesHandler } from '@/app/api/philosophical-entities/route';
import { GET as getEntityByIdHandler, PATCH as updateEntityHandler, DELETE as deleteEntityHandler } from '@/app/api/philosophical-entities/[id]/route';
import { GET as getRelationshipsHandler } from '@/app/api/philosophical-entities/[id]/relationships/route';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { getServerSession } from 'next-auth/next';
import { USER_ROLES } from '@/lib/constants';

// Mock the controller
jest.mock('@/controllers/philosophicalEntityController');

describe('Philosophical Entities API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/philosophical-entities', () => {
    it('should return a list of entities with pagination', async () => {
      // Mock controller response
      jest.mocked(PhilosophicalEntityController.getAllEntities).mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'entity-1', name: 'Test Entity 1', type: 'Philosopher', description: 'Description 1' },
          { id: 'entity-2', name: 'Test Entity 2', type: 'Concept', description: 'Description 2' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities');

      // Call the handler
      const response = await getEntitiesHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(data.data.length).toBe(2);
      expect(PhilosophicalEntityController.getAllEntities).toHaveBeenCalledTimes(1);
    });

    it('should handle query parameters correctly', async () => {
      // Mock controller response
      jest.mocked(PhilosophicalEntityController.getAllEntities).mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 5,
          totalPages: 0
        }
      });

      // Create mock request with query params
      const url = new URL('http://localhost:3000/api/philosophical-entities');
      url.searchParams.set('type', 'Philosopher');
      url.searchParams.set('search', 'Kant');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '5');

      const req = new NextRequest(url);

      // Call the handler
      await getEntitiesHandler(req);

      // Assert proper parameter passing
      expect(PhilosophicalEntityController.getAllEntities).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Philosopher',
          search: 'Kant',
          page: 2,
          limit: 5
        })
      );
    });

    it('should handle server errors gracefully', async () => {
      // Mock controller error response
      jest.mocked(PhilosophicalEntityController.getAllEntities).mockResolvedValueOnce({
        success: false,
        error: 'Database error'
      });

      // Create mock request
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities');

      // Call the handler
      const response = await getEntitiesHandler(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/philosophical-entities/:id', () => {
    it('should return a single entity by ID', async () => {
      // Mock controller response
      jest.mocked(PhilosophicalEntityController.getEntityById).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'entity-1',
          name: 'Test Entity',
          type: 'Philosopher',
          description: 'Description',
          relationships: []
        }
      });

      // Create mock request and params
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/entity-1');
      const params = { id: 'entity-1' };

      // Call the handler
      const response = await getEntityByIdHandler(req, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 'entity-1');
      expect(PhilosophicalEntityController.getEntityById).toHaveBeenCalledWith('entity-1');
    });

    it('should return 404 for non-existent entity', async () => {
      // Mock controller not found response
      jest.mocked(PhilosophicalEntityController.getEntityById).mockResolvedValueOnce({
        success: false,
        error: 'Entity not found'
      });

      // Create mock request and params
      const req = new NextRequest('http://localhost:3000/api/philosophical-entities/non-existent');
      const params = { id: 'non-existent' };

      // Call the handler
      const response = await getEntityByIdHandler(req, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    });
  });

  // Add more tests for other endpoints as needed
});
