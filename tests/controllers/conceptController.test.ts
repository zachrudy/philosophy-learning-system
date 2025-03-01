import { ConceptController } from '@/controllers/conceptController';
import { prisma } from '@/lib/db/prisma';

// Typing for mocked prisma
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ConceptController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllConcepts', () => {
    it('should return all concepts successfully', async () => {
      // Arrange
      const mockConcepts = [
        { id: '1', name: 'Epistemology', description: 'Study of knowledge', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Metaphysics', description: 'Study of reality', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrisma.concept.findMany.mockResolvedValue(mockConcepts);

      // Act
      const result = await ConceptController.getAllConcepts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConcepts);
      expect(mockPrisma.concept.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.concept.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should handle errors when fetching concepts', async () => {
      // Arrange
      mockPrisma.concept.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await ConceptController.getAllConcepts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch concepts');
      expect(mockPrisma.concept.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConceptById', () => {
    it('should return a concept with its relationships', async () => {
      // Arrange
      const mockConcept = {
        id: '1',
        name: 'Epistemology',
        description: 'Study of knowledge',
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: [
          {
            prerequisite: {
              id: '2',
              name: 'Logic',
              description: 'Study of reasoning',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        dependentConcepts: [],
        lectures: [],
        reflectionPrompts: [],
      };

      mockPrisma.concept.findUnique.mockResolvedValue(mockConcept);

      // Act
      const result = await ConceptController.getConceptById('1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...mockConcept,
        prerequisites: [mockConcept.prerequisites[0].prerequisite],
        dependentConcepts: [],
      });
      expect(mockPrisma.concept.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.concept.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
          dependentConcepts: {
            include: {
              dependentConcept: true,
            },
          },
          lectures: true,
          reflectionPrompts: true,
        },
      });
    });

    it('should return error if concept is not found', async () => {
      // Arrange
      mockPrisma.concept.findUnique.mockResolvedValue(null);

      // Act
      const result = await ConceptController.getConceptById('999');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Concept not found');
      expect(mockPrisma.concept.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  // Additional tests for createConcept, updateConcept, and deleteConcept would follow the same pattern
});
