// tests/api/philosophical-entities.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { USER_ROLES } from '@/lib/constants';

// Import the actual modules first
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
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

      // Mock the session
      jest.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: USER_ROLES.ADMIN
        }
      })
    });

  //////////////////////////////////////////////////////////////////////////////
  // GET /api/philosophical-entities
  //////////////////////////////////////////////////////////////////////////////

  describe('GET /api/philosophical-entities', () => {
    it('should return a list of entities with pagination', async () => {
      // Mock data
      const mockEntities = [
        { id: 'entity-1', name: 'Test Entity 1', type: 'Philosopher', description: 'Description 1' },
        { id: 'entity-2', name: 'Test Entity 2', type: 'Concept', description: 'Description 2' }
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

    // Implement the rest of your tests using the same pattern...
  });
});
