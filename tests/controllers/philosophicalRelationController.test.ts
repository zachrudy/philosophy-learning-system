// tests/controllers/philosophicalRelationController.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PhilosophicalRelationController } from '@/controllers/philosophicalRelationController';
import { prisma } from '@/lib/db/prisma';
import { RELATION_TYPES, RelationType } from '@/lib/constants';

// Mock the Prisma client
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PhilosophicalRelationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRelationship', () => {
    it('should validate a valid relationship', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT']
      };

      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        if (args.where.id === 'philosopher-1') {
          return Promise.resolve({
            id: 'philosopher-1',
            type: 'Philosopher',
            name: 'Immanuel Kant'
          });
        } else if (args.where.id === 'concept-1') {
          return Promise.resolve({
            id: 'concept-1',
            type: 'PhilosophicalConcept',
            name: 'Categorical Imperative'
          });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await PhilosophicalRelationController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject relationship with non-existent entities', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'nonexistent-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT']
      };

      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        if (args.where.id === 'concept-1') {
          return Promise.resolve({
            id: 'concept-1',
            type: 'PhilosophicalConcept',
            name: 'Categorical Imperative'
          });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await PhilosophicalRelationController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('source entity not found');
    });

    it('should reject self-referential relationships', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'concept-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT']
      };

      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        if (args.where.id === 'concept-1') {
          return Promise.resolve({
            id: 'concept-1',
            type: 'PhilosophicalConcept',
            name: 'Categorical Imperative'
          });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await PhilosophicalRelationController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('cannot have a relationship with itself');
    });

    it('should reject relationship with invalid relation types', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['INVALID_TYPE']
      };

      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        if (args.where.id === 'philosopher-1') {
          return Promise.resolve({
            id: 'philosopher-1',
            type: 'Philosopher',
            name: 'Immanuel Kant'
          });
        } else if (args.where.id === 'concept-1') {
          return Promise.resolve({
            id: 'concept-1',
            type: 'PhilosophicalConcept',
            name: 'Categorical Imperative'
          });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await PhilosophicalRelationController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('invalid relation type');
    });

    it('should validate relationship semantics based on entity types', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'concept-1',
        targetEntityId: 'concept-2',
        relationTypes: ['ADDRESSES_PROBLEMATIC']
      };

      mockPrisma.philosophicalEntity.findUnique.mockImplementation((args) => {
        if (args.where.id === 'concept-1') {
          return Promise.resolve({
            id: 'concept-1',
            type: 'PhilosophicalConcept',
            name: 'Categorical Imperative'
          });
        } else if (args.where.id === 'concept-2') {
          return Promise.resolve({
            id: 'concept-2',
            type: 'PhilosophicalConcept', // Not a Problematic
            name: 'Another Concept'
          });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await PhilosophicalRelationController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('ADDRESSES_PROBLEMATIC relation requires target to be a Problematic');
    });
  });

  describe('createRelationship', () => {
    it('should create a relationship between entities successfully', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT'],
        description: 'Kant developed the Categorical Imperative',
        importance: 5
      };

      // Mock the validation method to return valid
      jest.spyOn(PhilosophicalRelationController, 'validateRelationship').mockResolvedValue({
        valid: true,
        errors: []
      });

      mockPrisma.philosophicalRelation.create.mockResolvedValue({
        id: 'relation-1',
        sourceEntityId: relationData.sourceEntityId,
        targetEntityId: relationData.targetEntityId,
        relationTypes: JSON.stringify(relationData.relationTypes),
        description: relationData.description,
        importance: relationData.importance,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalRelationController.createRelationship(relationData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.sourceEntityId).toBe(relationData.sourceEntityId);
      expect(result.data.targetEntityId).toBe(relationData.targetEntityId);
      expect(mockPrisma.philosophicalRelation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceEntityId: 'philosopher-1',
            targetEntityId: 'concept-1'
          }),
          include: expect.any(Object)
        })
      );
    });

    it('should not create a relationship if validation fails', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['INVALID_TYPE']
      };

      // Mock validation to fail
      jest.spyOn(PhilosophicalRelationController, 'validateRelationship').mockResolvedValue({
        valid: false,
        errors: ['Invalid relation type']
      });

      // Act
      const result = await PhilosophicalRelationController.createRelationship(relationData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid relation type');
      expect(mockPrisma.philosophicalRelation.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRelationship', () => {
    it('should update a relationship successfully', async () => {
      // Arrange
      const relationId = 'relation-1';
      const updateData = {
        description: 'Updated description',
        importance: 4,
        relationTypes: ['LOGICAL_CONNECTION']
      };

      // Mock finding the existing relationship
      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue({
        id: relationId,
        sourceEntityId: 'source-1',
        targetEntityId: 'target-1',
        relationTypes: JSON.stringify(['DEVELOPMENT']),
        description: 'Original description',
        importance: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock validation
      jest.spyOn(PhilosophicalRelationController, 'validateRelationship').mockResolvedValue({
        valid: true,
        errors: []
      });

      // Mock the update
      mockPrisma.philosophicalRelation.update.mockResolvedValue({
        id: relationId,
        sourceEntityId: 'source-1',
        targetEntityId: 'target-1',
        relationTypes: JSON.stringify(updateData.relationTypes),
        description: updateData.description,
        importance: updateData.importance,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalRelationController.updateRelationship(relationId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.description).toBe(updateData.description);
      expect(result.data.importance).toBe(updateData.importance);
      expect(mockPrisma.philosophicalRelation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: relationId },
          data: expect.objectContaining({
            description: updateData.description,
            importance: updateData.importance
          }),
          include: expect.any(Object)
        })
      );
    });

    it('should return error if relationship to update is not found', async () => {
      // Arrange
      const relationId = 'nonexistent-id';
      const updateData = { description: 'Updated description' };

      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalRelationController.updateRelationship(relationId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Relationship not found');
      expect(mockPrisma.philosophicalRelation.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteRelationship', () => {
    it('should delete a relationship successfully', async () => {
      // Arrange
      const relationId = 'relation-1';
      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue({
        id: relationId,
        sourceEntityId: 'source-1',
        targetEntityId: 'target-1',
        relationTypes: JSON.stringify(['DEVELOPMENT']),
        description: 'Description',
        importance: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockPrisma.philosophicalRelation.delete.mockResolvedValue({
        id: relationId,
        sourceEntityId: 'source-1',
        targetEntityId: 'target-1',
        relationTypes: JSON.stringify(['DEVELOPMENT']),
        description: 'Description',
        importance: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalRelationController.deleteRelationship(relationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      expect(mockPrisma.philosophicalRelation.delete).toHaveBeenCalledWith({
        where: { id: relationId }
      });
    });

    it('should return error if relationship to delete is not found', async () => {
      // Arrange
      const relationId = 'nonexistent-id';
      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalRelationController.deleteRelationship(relationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Relationship not found');
      expect(mockPrisma.philosophicalRelation.delete).not.toHaveBeenCalled();
    });
  });

  describe('getRelationshipsByEntityId', () => {
    it('should return all relationships for an entity', async () => {
      // Arrange
      const entityId = 'entity-1';
      const mockSourceRelations = [
        {
          id: 'relation-1',
          sourceEntityId: entityId,
          targetEntityId: 'target-1',
          relationTypes: JSON.stringify(['DEVELOPMENT']),
          description: 'Outgoing relation',
          importance: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
          targetEntity: {
            id: 'target-1',
            name: 'Target Entity',
            type: 'PhilosophicalConcept'
          }
        }
      ];

      const mockTargetRelations = [
        {
          id: 'relation-2',
          sourceEntityId: 'source-1',
          targetEntityId: entityId,
          relationTypes: JSON.stringify(['LOGICAL_CONNECTION']),
          description: 'Incoming relation',
          importance: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceEntity: {
            id: 'source-1',
            name: 'Source Entity',
            type: 'Philosopher'
          }
        }
      ];

      // Mock entity existence check
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: entityId,
        name: 'Test Entity',
        type: 'PhilosophicalConcept',
        description: 'A test entity',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock finding relations
      mockPrisma.philosophicalRelation.findMany.mockImplementation((args) => {
        if (args.where.sourceEntityId === entityId) {
          return Promise.resolve(mockSourceRelations);
        } else {
          return Promise.resolve(mockTargetRelations);
        }
      });

      // Act
      const result = await PhilosophicalRelationController.getRelationshipsByEntityId(entityId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe('relation-1');
      expect(result.data[0].direction).toBe('outgoing');
      expect(result.data[1].id).toBe('relation-2');
      expect(result.data[1].direction).toBe('incoming');
      expect(mockPrisma.philosophicalRelation.findMany).toHaveBeenCalledTimes(2);
    });

    it('should return error if entity is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalRelationController.getRelationshipsByEntityId(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
      expect(mockPrisma.philosophicalRelation.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getRelationshipById', () => {
    it('should return a relationship by its ID', async () => {
      // Arrange
      const relationId = 'relation-1';
      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue({
        id: relationId,
        sourceEntityId: 'source-1',
        targetEntityId: 'target-1',
        relationTypes: JSON.stringify(['DEVELOPMENT']),
        description: 'A test relationship',
        importance: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceEntity: {
          id: 'source-1',
          name: 'Source Entity',
          type: 'Philosopher'
        },
        targetEntity: {
          id: 'target-1',
          name: 'Target Entity',
          type: 'PhilosophicalConcept'
        }
      });

      // Act
      const result = await PhilosophicalRelationController.getRelationshipById(relationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(relationId);
      expect(result.data.relationTypes).toEqual(['DEVELOPMENT']);
      expect(mockPrisma.philosophicalRelation.findUnique).toHaveBeenCalledWith({
        where: { id: relationId },
        include: {
          sourceEntity: true,
          targetEntity: true
        }
      });
    });

    it('should return error if relationship is not found', async () => {
      // Arrange
      const relationId = 'nonexistent-id';
      mockPrisma.philosophicalRelation.findUnique.mockResolvedValue(null);

      // Act
      const result = await PhilosophicalRelationController.getRelationshipById(relationId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Relationship not found');
    });
  });
});
