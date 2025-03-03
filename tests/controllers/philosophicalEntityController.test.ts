// tests/controllers/philosophicalEntityController.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PhilosophicalEntityController } from '@/controllers/philosophicalEntityController';
import { prisma } from '@/lib/db/prisma';
import { RelationType } from '@prisma/client';

// Mocked prisma
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

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
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.createEntity(conceptData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(conceptData.name);
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
        sourceRelations: [
          {
            id: 'relation-1',
            targetEntityId: 'problematic-1',
            relationTypes: [RelationType.ADDRESSES_PROBLEMATIC],
            description: 'Addresses the question of moral duty',
            importance: 5,
            targetEntity: {
              id: 'problematic-1',
              type: 'Problematic',
              name: 'Nature of moral duty',
              description: 'What is the source of moral obligation?'
            }
          }
        ],
        targetRelations: [
          {
            id: 'relation-2',
            sourceEntityId: 'philosopher-1',
            relationTypes: [RelationType.DEVELOPMENT],
            description: 'Developed by Kant',
            importance: 5,
            sourceEntity: {
              id: 'philosopher-1',
              type: 'Philosopher',
              name: 'Immanuel Kant',
              description: 'German philosopher'
            }
          }
        ]
      };

      mockPrisma.philosophicalEntity.findUnique.mockResolvedValue(mockEntity);

      // Act
      const result = await PhilosophicalEntityController.getEntityById(entityId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(entityId);
      expect(result.data.name).toBe('Categorical Imperative');
      expect(result.data.relationships.length).toBe(2);
      expect(mockPrisma.philosophicalEntity.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        include: {
          sourceRelations: {
            include: {
              targetEntity: true
            }
          },
          targetRelations: {
            include: {
              sourceEntity: true
            }
          }
        }
      });
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
      expect(mockPrisma.philosophicalEntity.update).toHaveBeenCalledWith({
        where: { id: entityId },
        data: updateData
      });
    });

    it('should return error if entity to update is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      const updateData = { description: 'Updated description' };

      mockPrisma.philosophicalEntity.update.mockRejectedValue(new Error('Record not found'));

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
      expect(mockPrisma.philosophicalEntity.delete).toHaveBeenCalledWith({
        where: { id: entityId }
      });
    });

    it('should return error if entity to delete is not found', async () => {
      // Arrange
      const entityId = 'nonexistent-id';
      mockPrisma.philosophicalEntity.delete.mockRejectedValue(new Error('Record not found'));

      // Act
      const result = await PhilosophicalEntityController.deleteEntity(entityId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete entity');
      expect(mockPrisma.philosophicalEntity.delete).toHaveBeenCalledWith({
        where: { id: entityId }
      });
    });
  });

  // RELATIONSHIP TESTS

  describe('createRelationship', () => {
    it('should create a relationship between entities successfully', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: [RelationType.DEVELOPMENT],
        description: 'Kant developed the Categorical Imperative',
        importance: 5
      };

      mockPrisma.philosophicalRelation.create.mockResolvedValue({
        id: 'relation-1',
        ...relationData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await PhilosophicalEntityController.createRelationship(relationData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.sourceEntityId).toBe(relationData.sourceEntityId);
      expect(result.data.targetEntityId).toBe(relationData.targetEntityId);
      expect(mockPrisma.philosophicalRelation.create).toHaveBeenCalledWith({
        data: relationData
      });
    });

    it('should reject creation of duplicate relationship', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: [RelationType.DEVELOPMENT],
        description: 'Kant developed the Categorical Imperative'
      };

      mockPrisma.philosophicalRelation.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      // Act
      const result = await PhilosophicalEntityController.createRelationship(relationData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create relationship');
      expect(mockPrisma.philosophicalRelation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceEntityId: 'philosopher-1',
          targetEntityId: 'concept-1'
        })
      });
    });
  });

  describe('getRelationshipsByEntityId', () => {
    it('should return all relationships for an entity', async () => {
      // Arrange
      const entityId = 'concept-1';
      const mockSourceRelations = [
        {
          id: 'relation-1',
          sourceEntityId: entityId,
          targetEntityId: 'problematic-1',
          relationTypes: [RelationType.ADDRESSES_PROBLEMATIC],
          description: 'Addresses the problematic',
          importance: 4,
          targetEntity: {
            id: 'problematic-1',
            name: 'Nature of moral duty'
          }
        }
      ];

      const mockTargetRelations = [
        {
          id: 'relation-2',
          sourceEntityId: 'philosopher-1',
          targetEntityId: entityId,
          relationTypes: [RelationType.DEVELOPMENT],
          description: 'Developed by Kant',
          importance: 5,
          sourceEntity: {
            id: 'philosopher-1',
            name: 'Immanuel Kant'
          }
        }
      ];

      mockPrisma.philosophicalRelation.findMany.mockImplementation((args) => {
        if (args.where.sourceEntityId === entityId) {
          return Promise.resolve(mockSourceRelations);
        } else {
          return Promise.resolve(mockTargetRelations);
        }
      });

      // Act
      const result = await PhilosophicalEntityController.getRelationshipsByEntityId(entityId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe('relation-1');
      expect(result.data[1].id).toBe('relation-2');
      expect(mockPrisma.philosophicalRelation.findMany).toHaveBeenCalledTimes(2);
    });
  });

  // TRAVERSAL TESTS

  describe('getPrerequisites', () => {
    it('should return prerequisites for a concept', async () => {
      // Arrange
      const conceptId = 'concept-advanced';

      mockPrisma.philosophicalRelation.findMany.mockResolvedValue([
        {
          id: 'relation-1',
          sourceEntityId: 'concept-basic-1',
          targetEntityId: conceptId,
          relationTypes: [RelationType.HIERARCHICAL],
          description: 'Basic concept needed for understanding',
          importance: 5,
          sourceEntity: {
            id: 'concept-basic-1',
            type: 'PhilosophicalConcept',
            name: 'Basic Concept 1',
            description: 'A foundational concept'
          }
        },
        {
          id: 'relation-2',
          sourceEntityId: 'concept-basic-2',
          targetEntityId: conceptId,
          relationTypes: [RelationType.HIERARCHICAL],
          description: 'Another basic concept needed',
          importance: 4,
          sourceEntity: {
            id: 'concept-basic-2',
            type: 'PhilosophicalConcept',
            name: 'Basic Concept 2',
            description: 'Another foundational concept'
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
      expect(mockPrisma.philosophicalRelation.findMany).toHaveBeenCalledWith({
        where: {
          targetEntityId: conceptId,
          relationTypes: {
            hasSome: [RelationType.HIERARCHICAL]
          }
        },
        include: {
          sourceEntity: true
        }
      });
    });
  });

  describe('getLearningPath', () => {
    it('should return a topologically sorted learning path to a target concept', async () => {
      // Arrange
      const targetConceptId = 'concept-advanced';

      // Mock recursive prerequisites lookup with a simple implementation
      // In a real test, you would need a more sophisticated approach to handle the recursion
      mockPrisma.philosophicalRelation.findMany.mockImplementation((args) => {
        // First level of prerequisites
        if (args.where.targetEntityId === 'concept-advanced') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-intermediate-1',
              targetEntityId: 'concept-advanced',
              relationTypes: [RelationType.HIERARCHICAL],
              sourceEntity: {
                id: 'concept-intermediate-1',
                type: 'PhilosophicalConcept',
                name: 'Intermediate Concept 1'
              }
            },
            {
              sourceEntityId: 'concept-intermediate-2',
              targetEntityId: 'concept-advanced',
              relationTypes: [RelationType.HIERARCHICAL],
              sourceEntity: {
                id: 'concept-intermediate-2',
                type: 'PhilosophicalConcept',
                name: 'Intermediate Concept 2'
              }
            }
          ]);
        }
        // Second level prerequisites
        else if (args.where.targetEntityId === 'concept-intermediate-1') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-basic-1',
              targetEntityId: 'concept-intermediate-1',
              relationTypes: [RelationType.HIERARCHICAL],
              sourceEntity: {
                id: 'concept-basic-1',
                type: 'PhilosophicalConcept',
                name: 'Basic Concept 1'
              }
            }
          ]);
        }
        else if (args.where.targetEntityId === 'concept-intermediate-2') {
          return Promise.resolve([
            {
              sourceEntityId: 'concept-basic-2',
              targetEntityId: 'concept-intermediate-2',
              relationTypes: [RelationType.HIERARCHICAL],
              sourceEntity: {
                id: 'concept-basic-2',
                type: 'PhilosophicalConcept',
                name: 'Basic Concept 2'
              }
            }
          ]);
        }
        // Basic concepts have no prerequisites
        else {
          return Promise.resolve([]);
        }
      });

      // Also mock the direct concept lookup
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
  });
});

// tests/controllers/philosophicalRelationController.test.ts

describe('PhilosophicalRelationController', () => {
  describe('validateRelationship', () => {
    it('should validate a valid relationship', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: [RelationType.DEVELOPMENT]
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
      const result = await PhilosophicalEntityController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject relationship with non-existent entities', async () => {
      // Arrange
      const relationData = {
        sourceEntityId: 'nonexistent-1',
        targetEntityId: 'concept-1',
        relationTypes: [RelationType.DEVELOPMENT]
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
      const result = await PhilosophicalEntityController.validateRelationship(relationData);

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
        relationTypes: [RelationType.DEVELOPMENT]
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
      const result = await PhilosophicalEntityController.validateRelationship(relationData);

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
      const result = await PhilosophicalEntityController.validateRelationship(relationData);

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
        relationTypes: [RelationType.ADDRESSES_PROBLEMATIC]
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
      const result = await PhilosophicalEntityController.validateRelationship(relationData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('ADDRESSES_PROBLEMATIC relation requires target to be a Problematic');
    });
  });
});
