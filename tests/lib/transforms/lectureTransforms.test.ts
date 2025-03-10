// tests/lib/transforms/lectureTransforms.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  transformLecture,
  transformLectureWithRelations,
  transformLectureEntityRelation,
  transformLecturePrerequisite,
  transformReflection,
  createApiResponse,
  createPaginatedResponse,
  transformArray
} from '@/lib/transforms';
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';
import { sampleLectures } from '../../fixtures/lecture-fixtures';

// Mock the constants module to control the deserialization behavior
jest.mock('@/lib/constants', () => {
  const originalModule = jest.requireActual('@/lib/constants');
  return {
    ...originalModule,
    LECTURE_ENTITY_RELATION_TYPES: originalModule.LECTURE_ENTITY_RELATION_TYPES,
    deserializeJsonFromDb: jest.fn((jsonString) => {
      if (!jsonString) return null;
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        return null;
      }
    })
  };
});

describe('Lecture Transform Functions', () => {
  describe('transformLecture', () => {
    it('should transform a basic lecture correctly', () => {
      // Arrange
      const lecture = {
        id: 'lecture-1',
        title: "Introduction to Plato",
        description: "An overview of Plato's philosophy",
        contentUrl: "https://example.com/videos/plato-intro",
        lecturerName: "Michael Sugrue",
        contentType: "video",
        category: "ancient-philosophy",
        order: 1,
        embedAllowed: true,
        sourceAttribution: "Source: Michael Sugrue Lectures",
        preLecturePrompt: "Pre lecture prompt",
        initialPrompt: "Initial prompt",
        masteryPrompt: "Mastery prompt",
        evaluationPrompt: "Evaluation prompt",
        discussionPrompts: "Discussion prompts",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const result = transformLecture(lecture);

      // Assert
      expect(result).toEqual(lecture); // For now, the transform is identity
      expect(result.title).toBe("Introduction to Plato");
    });
  });

  describe('transformLectureWithRelations', () => {
    it('should transform a lecture with entities correctly', () => {
      // Arrange
      const lecture = {
        id: 'lecture-1',
        title: "Introduction to Plato",
        description: "An overview of Plato's philosophy",
        contentUrl: "https://example.com/videos/plato-intro",
        lecturerName: "Michael Sugrue",
        contentType: "video",
        category: "ancient-philosophy",
        order: 1,
        embedAllowed: true,
        sourceAttribution: "Source: Michael Sugrue Lectures",
        preLecturePrompt: "Pre lecture prompt",
        initialPrompt: "Initial prompt",
        masteryPrompt: "Mastery prompt",
        evaluationPrompt: "Evaluation prompt",
        discussionPrompts: "Discussion prompts",
        createdAt: new Date(),
        updatedAt: new Date(),
        entities: [
          {
            id: 'entity-1',
            type: 'Philosopher',
            name: 'Plato',
            description: 'Ancient Greek philosopher',
            keyTerms: JSON.stringify(['Forms', 'Republic']),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        entityRelations: [
          {
            id: 'relation-1',
            lectureId: 'lecture-1',
            entityId: 'entity-1',
            relationType: LECTURE_ENTITY_RELATION_TYPES.INTRODUCES
          }
        ]
      };

      // Set up the mock for deserializeJsonFromDb
      const { deserializeJsonFromDb } = require('@/lib/constants');
      deserializeJsonFromDb.mockImplementation((jsonString) => {
        if (jsonString === JSON.stringify(['Forms', 'Republic'])) {
          return ['Forms', 'Republic'];
        }
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          return null;
        }
      });

      // Act
      const result = transformLectureWithRelations(lecture);

      // Assert
      expect(result.title).toBe("Introduction to Plato");
      expect(result.entities).toBeDefined();
      expect(result.entities?.[0].keyTerms).toEqual(['Forms', 'Republic']); // Should be deserialized
      expect(result.entityRelations).toBeDefined();
      expect(result.entityRelations?.[0].relationType).toBe(LECTURE_ENTITY_RELATION_TYPES.INTRODUCES);
    });
  });

  describe('transformReflection', () => {
    it('should deserialize AI evaluation in reflections', () => {
      // Arrange
      const reflection = {
        id: 'reflection-1',
        userId: 'user-1',
        lectureId: 'lecture-1',
        promptType: 'initial',
        content: 'My reflection on the lecture',
        aiEvaluation: JSON.stringify({
          score: 85,
          feedback: 'Good reflection',
          areas: {
            strength: ['Clear understanding'],
            improvement: ['Add more examples']
          },
          conceptualUnderstanding: 4,
          criticalThinking: 3
        }),
        status: 'SUBMITTED',
        score: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the deserialization function to return a parsed object
      const { deserializeJsonFromDb } = require('@/lib/constants');
      deserializeJsonFromDb.mockImplementation((json) => {
        if (!json) return null;

        // Return a parsed object that matches what we stringified above
        return {
          score: 85,
          feedback: 'Good reflection',
          areas: {
            strength: ['Clear understanding'],
            improvement: ['Add more examples']
          },
          conceptualUnderstanding: 4,
          criticalThinking: 3
        };
      });

      // Act
      const result = transformReflection(reflection);

      // Assert
      expect(result).toBeDefined();
      expect(result.parsedEvaluation).toBeDefined();
      expect(result.parsedEvaluation.score).toBe(85);
      expect(result.parsedEvaluation.areas.strength).toContain('Clear understanding');
    });
  });

  describe('Helper functions', () => {
    it('should create a standard API response', () => {
      // Arrange
      const data = { id: 'test', name: 'Test Entity' };
      const meta = { processingTime: 42 };

      // Act
      const result = createApiResponse(data, meta);

      // Assert
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual(meta);
    });

    it('should create a paginated API response', () => {
      // Arrange
      const data = [{ id: 'test1' }, { id: 'test2' }];
      const pagination = {
        total: 10,
        page: 1,
        limit: 2,
        totalPages: 5
      };

      // Act
      const result = createPaginatedResponse(data, pagination);

      // Assert
      expect(result.data).toEqual(data);
      expect(result.meta.pagination).toEqual(pagination);
    });

    it('should transform an array of items', () => {
      // Arrange
      const items = [1, 2, 3, 4];
      const transformFn = (n: number) => n * 2;

      // Act
      const result = transformArray(items, transformFn);

      // Assert
      expect(result).toEqual([2, 4, 6, 8]);
    });
  });
});
