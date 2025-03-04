// tests/controllers/philosophicalEntityController.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { prisma } from '@/lib/db/prisma';
import { RELATION_TYPES } from '@/lib/constants';

// Mock Prisma
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Manually mock the PhilosophicalRelationController
// IMPORTANT: Do this BEFORE importing the controller
jest.mock('@/controllers/philosophicalRelationController');

// Now import the mocked module
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';

// Create typed mocks for the methods we'll use
const mockedGetRelationshipsByEntityId = jest.fn();

// Set up the mock implementation
(PhilosophicalRelationController.getRelationshipsByEntityId as jest.Mock) = mockedGetRelationshipsByEntityId;

describe('PhilosophicalEntityController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CRUD TESTS

  describe('createEntity', () => {
    it('should create a philosophical concept successfully', async () => {
      // Arrange
      const conceptData = {
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'A central concept in Kant\'s ethics',
        primaryText: 'Groundwork of the Metaphysics of Morals',
        keyTerms: ['universalizability', 'moral law'],
        startDate: new Date('1785-01-01')
      };

      mockPrisma.philosophicalEntity.create.mockResolvedValue({
        id: 'concept-123',
        ...conceptData,
        keyTerms: JSON.stringify(conceptData.keyTerms), // Simulate DB serialization
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.createEntity(conceptData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(conceptData.name);
      expect(Array.isArray(result.data.keyTerms)).toBe(true); // Verify deserialization
      expect(mockPrisma.philosophicalEntity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'PhilosophicalConcept',
          name: 'Categorical Imperative'
        })
      });
    });

    it('should create a philosopher entity successfully', async () => {
      // Arrange
      const philosopherData = {
        type: 'Philosopher',
        name: 'Immanuel Kant',
        description: 'German philosopher of the Enlightenment',
        birthplace: 'Königsberg, Prussia',
        nationality: 'Prussian',
        biography: 'A prominent figure in modern philosophy',
        startDate: new Date('1724-04-22'),
        endDate: new Date('1804-02-12')
      };

      mockPrisma.philosophicalEntity.create.mockResolvedValue({
        id: 'philosopher-123',
        ...philosopherData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.createEntity(philosopherData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(philosopherData.name);
      expect(mockPrisma.philosophicalEntity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'Philosopher',
          name: 'Immanuel Kant',
          birthplace: 'Königsberg, Prussia'
        })
      });
    });

    it('should reject creation with invalid entity type', async () => {
      // Arrange
      const invalidData = {
        type: 'InvalidType',
        name: 'Test Entity',
        description: 'Invalid entity type'
      };

      // Act
      const result = await PhilosophicalEntityController.createEntity(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid entity type');
      expect(mockPrisma.philosophicalEntity.create).not.toHaveBeenCalled();
    });
  });

  describe('getEntityById', () => {
    it('should return a philosophical entity with its relationships', async () => {
      // Arrange
      const entityId = 'concept-123';

      // Mock entity data
      const mockEntity = {
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'A central concept in Kant\'s ethics',
        primaryText: 'Groundwork of the Metaphysics of Morals',
        startDate: new Date('1785-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Include these for backward compatibility with test, but they won't be used directly
        sourceRelations: [],
        targetRelations: []
      };

      // Mock relationships returned by the relationship controller
      const mockRelationships = [
        {
          id: 'relation-1',
          sourceEntityId: entityId,
          targetEntityId: 'problematic-1',
          relationTypes: ['ADDRESSES_PROBLEMATIC'],
          description: 'Addresses the question of moral duty',
          importance: 5,
          direction: 'outgoing',
          relatedEntity: {
            id: 'problematic-1',
            type: 'Problematic',
            name: 'Nature of moral duty',
            description: 'What is the source of moral obligation?'
          }
        },
        {
          id: 'relation-2',
          sourceEntityId: 'philosopher-1',
          targetEntityId: entityId,
          relationTypes: ['DEVELOPMENT'],
          description: 'Developed by Kant',
          importance: 5,
          direction: 'incoming',
          relatedEntity: {
            id: 'philosopher-1',
            type: 'Philosopher',
            name: 'Immanuel Kant',
            description: 'German philosopher'
          }
        }
      ];

      // Setup mocks
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(mockEntity);

      // Mock the relationship controller to return these relationships
      mockedGetRelationshipsByEntityId.mockResolvedValue({
        success: true,
        data: mockRelationships
      });

      // Act
      const result = await PhilosophicalEntityController.getEntityById(entityId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(entityId);
      expect(result.data.name).toBe('Categorical Imperative');
      expect(result.data.relationships).toBeDefined();
      expect(result.data.relationships.length).toBe(2);
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        include: expect.objectContaining({
          sourceRelations: expect.any(Object),
          targetRelations: expect.any(Object)
        })
      });
      expect(mockedGetRelationshipsByEntityId).toHaveBeenCalledWith(entityId);
    });

    it('should return error if entity is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalEntityController.getEntityById(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        include: expect.any(Object)
      });
      // Relationship controller should not be called if entity not found
      expect(mockedGetRelationshipsByEntityId).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const entityId = 'concept-123';
      mockPrisma.philosophicalEntity.findUnique.mockRejectedValue(
        new Error('Database connection error')
      );

      // Act
      const result = await PhilosophicalEntityController.getEntityById(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch entity');
      expect(mockedGetRelationshipsByEntityId).not.toHaveBeenCalled();
    });
  });

  describe('updateEntity', () => {
    it('should update an entity successfully', async () => {
      // Arrange
      const entityId = 'concept-123';
      const updateData = {
        description: 'Updated description of the Categorical Imperative',
        primaryText: 'Updated primary text'
      };

      // Mock findUnique for entity existence check
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'Original description',
        primaryText: 'Original text',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock update with updated data
      mockPrisma.philosophicalEntity.update.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: updateData.description,
        primaryText: updateData.primaryText,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.updateEntity(entityId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.description).toBe(updateData.description);
      // First check if entity exists
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId }
      });
      // Then update
      expect(mockPrisma.philosophicalEntity.update).toHaveBeenCalledWith({
        where: { id: entityId },
        data: updateData
      });
    });

    it('should return error if entity to update is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      const updateData = { description: 'Updated description' };

      // Mock entity existence check to return null (not found)
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalEntityController.updateEntity(entityId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId }
      });
      // Update should not be called if entity not found
      expect(mockPrisma.philosophicalEntity.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const entityId = 'concept-123';
      const updateData = { description: 'Updated description' };

      // Entity exists
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'Original description',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // But update fails
      mockPrisma.philosophicalEntity.update.mockRejectedValue(
        new Error('Database update error')
      );

      // Act
      const result = await PhilosophicalEntityController.updateEntity(entityId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update entity');
      expect(mockPrisma.philosophicalEntity.update).toHaveBeenCalledWith({
        where: { id: entityId },
        data: updateData
      });
    });
  });

  describe('deleteEntity', () => {
    it('should delete an entity successfully', async () => {
      // Arrange
      const entityId = 'concept-123';
      // Entity exists
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // Successful deletion
      mockPrisma.philosophicalEntity.delete.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.deleteEntity(entityId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      // Check entity exists first
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId }
      });
      // Then delete it
      expect(mockPrisma.philosophicalEntity.delete).toHaveBeenCalledWith({
        where: { id: entityId }
      });
    });

    it('should return error if entity to delete is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      // Entity doesn't exist
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalEntityController.deleteEntity(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId }
      });
      // Delete should not be called if entity doesn't exist
      expect(mockPrisma.philosophicalEntity.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during delete', async () => {
      // Arrange
      const entityId = 'concept-123';
      // Entity exists
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: entityId,
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // But delete fails
      mockPrisma.philosophicalEntity.delete.mockRejectedValue(
        new Error('Database delete error')
      );

      // Act
      const result = await PhilosophicalEntityController.deleteEntity(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete entity');
    });
  });

  // LEARNING PATH TESTS

  describe('getPrerequisites', () => {
    it('should return prerequisites for a concept', async () => {
      // Arrange
      const conceptId = 'concept-advanced';

      mockPrisma.philosophicalRelation.findMany.mockResolvedValue([
        {
          id: 'relation-1',
          sourceEntityId: 'concept-basic-1',
          targetEntityId: conceptId,
          relationTypes: JSON.stringify(['HIERARCHICAL']),
          description: 'Basic concept needed for understanding',
          importance: 5,
          sourceEntity: {
            id: 'concept-basic-1',
            type: 'PhilosophicalConcept',
            name: 'Basic Concept 1',
            description: 'A foundational concept',
            keyTerms: null
          }
        },
        {
          id: 'relation-2',
          sourceEntityId: 'concept-basic-2',
          targetEntityId: conceptId,
          relationTypes: JSON.stringify(['HIERARCHICAL']),
          description: 'Another basic concept needed',
          importance: 4,
          sourceEntity: {
            id: 'concept-basic-2',
            type: 'PhilosophicalConcept',
            name: 'Basic Concept 2',
            description: 'Another foundational concept',
            keyTerms: JSON.stringify(['term1', 'term2'])
          }
        }
      ]);

      // Act
      const result = await PhilosophicalEntityController.getPrerequisites(conceptId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('Basic Concept 1');
      expect(result.data[1].name).toBe('Basic Concept 2');
      expect(result.data[1].keyTerms).toEqual(['term1', 'term2']); // Check deserialization
      expect(mockPrisma.philosophicalRelation.findMany).toHaveBeenCalledWith({
        where: {
          targetEntityId: conceptId,
          relationTypes: {
            contains: expect.any(String) // Serialized version of ['HIERARCHICAL']
          }
        },
        include: {
          sourceEntity: true
        }
      });
    });

    it('should return empty array when no prerequisites exist', async () => {
      // Arrange
      const conceptId = 'concept-basic';
      // No prerequisites found
      mockPrisma.philosophicalRelation.findMany.mockResolvedValue([]);

      // Act
      const result = await PhilosophicalEntityController.getPrerequisites(conceptId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors when fetching prerequisites', async () => {
      // Arrange
      const conceptId = 'concept-advanced';
      mockPrisma.philosophicalRelation.findMany.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await PhilosophicalEntityController.getPrerequisites(conceptId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch prerequisites');
    });
  });

  describe('getLearningPath', () => {
    it('should return a topologically sorted learning path to a target concept', async () => {
      // Arrange
      const targetConceptId = 'concept-advanced';

      // Mock entity exists
      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        const idToName = {
          'concept-advanced': 'Advanced Concept',
          'concept-intermediate-1': 'Intermediate Concept 1',
          'concept-intermediate-2': 'Intermediate Concept 2',
          'concept-basic-1': 'Basic Concept 1',
          'concept-basic-2': 'Basic Concept 2'
        };

        const id = args.where.id;
        if (idToName[id]) {
          return Promise.resolve({
            id,
            type: 'PhilosophicalConcept',
            name: idToName[id],
            description: 'Description'
          });
        }
        return Promise.resolve(null);
      });

      // Mock recursive prerequisites lookup
      mockPrisma.philosophicalRelation.findMany.mockImplementation((args) => {
        if (args.where.targetEntityId === 'concept-advanced') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-intermediate-1',
              targetEntityId: 'concept-advanced',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-intermediate-1',
                type: 'PhilosophicalConcept',
                name: 'Intermediate Concept 1'
              }
            },
            {
              sourceEntityId: 'concept-intermediate-2',
              targetEntityId: 'concept-advanced',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-intermediate-2',
                type: 'PhilosophicalConcept',
                name: 'Intermediate Concept 2'
              }
            }
          ]);
        } else if (args.where.targetEntityId === 'concept-intermediate-1') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-basic-1',
              targetEntityId: 'concept-intermediate-1',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-basic-1',
                type: 'PhilosophicalConcept',
                name: 'Basic Concept 1'
              }
            }
          ]);
        } else if (args.where.targetEntityId === 'concept-intermediate-2') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-basic-2',
              targetEntityId: 'concept-intermediate-2',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-basic-2',
                type: 'PhilosophicalConcept',
                name: 'Basic Concept 2'
              }
            }
          ]);
        } else {
          return Promise.resolve([]);
        }
      });

      // Act
      const result = await PhilosophicalEntityController.getLearningPath(targetConceptId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(5);

      // Check the path is correctly ordered - basics first, then intermediates, then advanced
      const names = result.data.map(c => c.name);

      // Check that basic concepts come before intermediate concepts
      expect(names.indexOf('Basic Concept 1')).toBeLessThan(names.indexOf('Intermediate Concept 1'));
      expect(names.indexOf('Basic Concept 2')).toBeLessThan(names.indexOf('Intermediate Concept 2'));

      // Check that intermediate concepts come before the advanced concept
      expect(names.indexOf('Intermediate Concept 1')).toBeLessThan(names.indexOf('Advanced Concept'));
      expect(names.indexOf('Intermediate Concept 2')).toBeLessThan(names.indexOf('Advanced Concept'));

      // The target concept should be last
      expect(names[names.length - 1]).toBe('Advanced Concept');
    });

    it('should return error if target concept does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-concept';
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalEntityController.getLearningPath(nonExistentId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Target concept not found');
    });

    it('should handle cycles in the concept dependency graph', async () => {
      // Arrange
      const targetConceptId = 'concept-a';

      // Target concept exists
      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        const id = args.where.id;
        if (id === 'concept-a' || id === 'concept-b') {
          return Promise.resolve({
            id,
            type: 'PhilosophicalConcept',
            name: id === 'concept-a' ? 'Concept A' : 'Concept B',
            description: 'Description'
          });
        }
        return Promise.resolve(null);
      });

      // Mock a cyclic dependency: A depends on B, B depends on A
      mockPrisma.philosophicalRelation.findMany.mockImplementation((args) => {
        if (args.where.targetEntityId === 'concept-a') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-b',
              targetEntityId: 'concept-a',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-b',
                type: 'PhilosophicalConcept',
                name: 'Concept B'
              }
            }
          ]);
        } else if (args.where.targetEntityId === 'concept-b') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-a',
              targetEntityId: 'concept-b',
              relationTypes: JSON.stringify(['HIERARCHICAL']),
              sourceEntity: {
                id: 'concept-a',
                type: 'PhilosophicalConcept',
                name: 'Concept A'
              }
            }
          ]);
        }
        return Promise.resolve([]);
      });

      // Act
      const result = await PhilosophicalEntityController.getLearningPath(targetConceptId);

      // Assert - should handle the cycle gracefully
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data.map(c => c.name)).toEqual(expect.arrayContaining(['Concept A', 'Concept B']));
    });
  });
});
