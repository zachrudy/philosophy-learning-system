// tests/controllers/lectureController.test.ts
import { LectureController } from '@/controllers/lectureController';
import { prisma } from '@/lib/db/prisma';
import {
  sampleLectures,
  sampleEntityRelations
} from '../fixtures/lecture-fixtures';

// Mock the prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    lecture: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    philosophicalEntity: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    lectureEntityRelation: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn()
    },
    lecturePrerequisite: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(prisma))
  }
}));

describe('LectureController', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLectures', () => {
    it('should return all lectures with pagination', async () => {
      // Setup mock return values
      const mockLectures = sampleLectures.map((lecture, index) => ({
        id: `lecture-${index}`,
        ...lecture,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      prisma.lecture.count.mockResolvedValue(mockLectures.length);
      prisma.lecture.findMany.mockResolvedValue(mockLectures);

      // Execute the method
      const result = await LectureController.getAllLectures({
        page: 1,
        limit: 10
      });

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(mockLectures.length);
      expect(result.pagination).toEqual({
        total: mockLectures.length,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      expect(prisma.lecture.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10
        })
      );
    });

    it('should filter lectures by category', async () => {
      // Setup mock data
      const category = 'ancient-philosophy';
      const filteredLectures = sampleLectures
        .filter(lecture => lecture.category === category)
        .map((lecture, index) => ({
          id: `lecture-${index}`,
          ...lecture,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

      prisma.lecture.count.mockResolvedValue(filteredLectures.length);
      prisma.lecture.findMany.mockResolvedValue(filteredLectures);

      // Execute the method
      const result = await LectureController.getAllLectures({
        category,
        page: 1,
        limit: 10
      });

      // Assertions
      expect(result.success).toBe(true);
      expect(prisma.lecture.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category }
        })
      );
      expect(result.data).toEqual(filteredLectures);
    });
  });

  describe('getLectureById', () => {
    it('should return a lecture by ID', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.lecture.findUnique.mockResolvedValue(mockLecture);

      // Execute the method
      const result = await LectureController.getLectureById(lectureId);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLecture);
      expect(prisma.lecture.findUnique).toHaveBeenCalledWith({
        where: { id: lectureId },
        include: undefined
      });
    });

    it('should include related entities when requested', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockLecture = {
        id: lectureId,
        ...sampleLectures[0],
        entities: [{ id: 'entity-1', name: 'Plato' }],
        entityRelations: [
          {
            id: 'relation-1',
            lectureId,
            entityId: 'entity-1',
            relationType: 'introduces'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.lecture.findUnique.mockResolvedValue(mockLecture);

      // Execute the method
      const result = await LectureController.getLectureById(lectureId, {
        includeEntities: true
      });

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLecture);
      expect(prisma.lecture.findUnique).toHaveBeenCalledWith({
        where: { id: lectureId },
        include: expect.objectContaining({
          entities: true,
          entityRelations: true
        })
      });
    });

    it('should return error when lecture not found', async () => {
      // Setup mock data
      const lectureId = 'non-existent-id';
      prisma.lecture.findUnique.mockResolvedValue(null);

      // Execute the method
      const result = await LectureController.getLectureById(lectureId);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toBe('Lecture not found');
    });
  });

  describe('createLecture', () => {
    it('should create a new lecture', async () => {
      // Setup mock data
      const newLecture = sampleLectures[0];
      const createdLecture = {
        id: 'new-lecture-id',
        ...newLecture,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.lecture.create.mockResolvedValue(createdLecture);
      prisma.lecture.findUnique.mockResolvedValue(createdLecture);

      // Execute the method
      const result = await LectureController.createLecture(newLecture);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdLecture);
      expect(prisma.lecture.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: newLecture.title,
          description: newLecture.description,
          preLecturePrompt: newLecture.preLecturePrompt,
          initialPrompt: newLecture.initialPrompt,
          masteryPrompt: newLecture.masteryPrompt,
          evaluationPrompt: newLecture.evaluationPrompt,
          discussionPrompts: newLecture.discussionPrompts
        })
      });
    });

    it('should create entity relationships when provided', async () => {
      // Clear all mocks before this test
      jest.clearAllMocks();

      // Setup mock data
      const newLecture = {
        ...sampleLectures[0],
        entityRelations: sampleEntityRelations
      };

      const createdLecture = {
        id: 'new-lecture-id',
        ...newLecture,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the entity lookup to succeed
      prisma.philosophicalEntity.findUnique.mockResolvedValue({
        id: 'entity-plato-id',
        name: 'Plato',
        type: 'Philosopher'
      });

      // Mock the lecture creation to succeed
      prisma.lecture.create.mockResolvedValue(createdLecture);
      prisma.lecture.findUnique.mockResolvedValue(createdLecture);

      // Mock the entity relation creation to succeed
      prisma.lectureEntityRelation.create.mockResolvedValue({
        id: 'relation-1',
        lectureId: 'new-lecture-id',
        entityId: 'entity-plato-id',
        relationType: 'introduces'
      });

      // Execute the method
      const result = await LectureController.createLecture(newLecture);

      // Let's see what the actual result is if there's a failure
      if (!result.success) {
        console.log('Lecture creation failed with error:', result.error);
      }

      // Assertions
      expect(result.success).toBe(true);
      expect(prisma.philosophicalEntity.findUnique).toHaveBeenCalled();
      expect(prisma.lectureEntityRelation.create).toHaveBeenCalled();
    });

    it('should fail validation with missing required fields', async () => {
      // Setup invalid data (missing required fields)
      const invalidLecture = {
        title: 'Missing Fields Lecture',
        // Missing description and other required fields
        contentUrl: 'https://example.com/video',
        contentType: 'video',
        category: 'test'
      };

      // Execute the method
      const result = await LectureController.createLecture(invalidLecture as any);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(prisma.lecture.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLecture', () => {
    it('should update an existing lecture', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const existingLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = {
        title: 'Updated Lecture Title',
        description: 'Updated description'
      };

      const updatedLecture = {
        ...existingLecture,
        ...updateData,
        updatedAt: new Date()
      };

      prisma.lecture.findUnique.mockResolvedValue(existingLecture);
      prisma.lecture.update.mockResolvedValue(updatedLecture);

      // Execute the method
      const result = await LectureController.updateLecture(lectureId, updateData);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedLecture);
      expect(prisma.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: updateData
      });
    });

    it('should return error when lecture not found', async () => {
      // Setup mock data
      const lectureId = 'non-existent-id';
      const updateData = { title: 'New Title' };

      prisma.lecture.findUnique.mockResolvedValue(null);

      // Execute the method
      const result = await LectureController.updateLecture(lectureId, updateData);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toBe('Lecture not found');
      expect(prisma.lecture.update).not.toHaveBeenCalled();
    });

    it('should update entity relationships when provided', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const existingLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = {
        title: 'Updated Title',
        entityRelations: sampleEntityRelations
      };

      prisma.lecture.findUnique.mockResolvedValue(existingLecture);
      prisma.lecture.update.mockResolvedValue({ ...existingLecture, title: updateData.title });
      prisma.philosophicalEntity.findUnique.mockResolvedValue({ id: 'entity-id' });

      // Execute the method
      const result = await LectureController.updateLecture(lectureId, updateData);

      // Assertions
      expect(result.success).toBe(true);
      expect(prisma.lectureEntityRelation.deleteMany).toHaveBeenCalledWith({
        where: { lectureId }
      });
    });
  });

  describe('deleteLecture', () => {
    it('should delete a lecture', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: [],
        prerequisiteFor: []
      };

      prisma.lecture.findUnique.mockResolvedValue(mockLecture);
      prisma.lecture.delete.mockResolvedValue(mockLecture);

      // Execute the method
      const result = await LectureController.deleteLecture(lectureId);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lecture deleted successfully');
      expect(prisma.lectureEntityRelation.deleteMany).toHaveBeenCalledWith({
        where: { lectureId }
      });
      expect(prisma.lecturePrerequisite.deleteMany).toHaveBeenCalledWith({
        where: { lectureId }
      });
      expect(prisma.lecture.delete).toHaveBeenCalledWith({
        where: { id: lectureId }
      });
    });

    it('should not delete a lecture that is a prerequisite for others', async () => {
      // Setup mock data
      const lectureId = 'lecture-1';
      const mockLecture = {
        id: lectureId,
        ...sampleLectures[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: [],
        prerequisiteFor: [{ id: 'prereq-1', lectureId: 'lecture-2' }]
      };

      prisma.lecture.findUnique.mockResolvedValue(mockLecture);

      // Execute the method
      const result = await LectureController.deleteLecture(lectureId);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete lecture that is a prerequisite for other lectures');
      expect(prisma.lecture.delete).not.toHaveBeenCalled();
    });
  });
});
