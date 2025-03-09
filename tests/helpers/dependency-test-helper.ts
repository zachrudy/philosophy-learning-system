// tests/helpers/dependency-test-helper.ts
import { prisma } from '@/lib/db/prisma';
import { LecturePrerequisiteController } from '@/controllers/lecturePrerequisiteController';
import { circularDependencyScenarios } from '../fixtures/lecture-fixtures';

/**
 * Helper utility for manually testing dependency validation
 * This can be used in development to verify prerequisite relationships
 */
export const DependencyTestHelper = {
  /**
   * Create a test dependency graph in the database
   * @param scenarioName Name of the predefined scenario from fixtures
   * @returns Created prerequisite IDs for cleanup
   */
  async createTestDependencyGraph(scenarioName: 'directCircular' | 'indirectCircular' | 'selfReference'): Promise<string[]> {
    // Get the scenario data
    const scenario = circularDependencyScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioName} not found`);
    }

    // Create temporary lectures for the test
    const createdLectures: Record<string, any> = {};
    const createdPrereqs: string[] = [];

    try {
      // Create lectures with unique titles based on IDs
      for (const prereq of scenario) {
        // Extract lecture IDs from the prerequisite
        const lectureIds = [
          prereq.lectureId,
          prereq.prerequisiteLectureId
        ];

        // Create any lectures that don't exist yet
        for (const id of lectureIds) {
          if (!createdLectures[id]) {
            const title = id.replace('lecture-', '').replace('-id', '');
            const lecture = await prisma.lecture.create({
              data: {
                title: `Test ${title}`,
                description: `Test lecture for ${title}`,
                contentUrl: `https://example.com/test/${title}`,
                lecturerName: 'Test Lecturer',
                contentType: 'test',
                category: 'test',
                order: 1,
                sourceAttribution: 'Test',
                preLecturePrompt: 'Test prompt',
                initialPrompt: 'Test prompt',
                masteryPrompt: 'Test prompt',
                evaluationPrompt: 'Test prompt',
                discussionPrompts: 'Test prompt'
              }
            });
            createdLectures[id] = lecture;
          }
        }

        // Create the prerequisite relationship - skipping validation
        const created = await prisma.lecturePrerequisite.create({
          data: {
            lectureId: createdLectures[prereq.lectureId].id,
            prerequisiteLectureId: createdLectures[prereq.prerequisiteLectureId].id,
            isRequired: prereq.isRequired ?? true,
            importanceLevel: prereq.importanceLevel ?? 3
          }
        });

        createdPrereqs.push(created.id);
      }

      return createdPrereqs;
    } catch (error) {
      // Clean up any created resources on error
      await this.cleanupTestDependencyGraph(Object.values(createdLectures).map(l => l.id), createdPrereqs);
      throw error;
    }
  },

  /**
   * Clean up test data
   */
  async cleanupTestDependencyGraph(lectureIds: string[], prereqIds: string[]): Promise<void> {
    // Delete prerequisites first
    if (prereqIds.length > 0) {
      await prisma.lecturePrerequisite.deleteMany({
        where: {
          id: {
            in: prereqIds
          }
        }
      });
    }

    // Then delete lectures
    if (lectureIds.length > 0) {
      await prisma.lecture.deleteMany({
        where: {
          id: {
            in: lectureIds
          }
        }
      });
    }
  },

  /**
   * Test the circular dependency detection with a real database
   * This function creates test data, runs the check, and cleans up
   * @param scenarioName Name of the predefined scenario
   * @returns The result of the dependency check
   */
  async testCircularDependencyDetection(scenarioName: 'directCircular' | 'indirectCircular' | 'selfReference'): Promise<{
    scenarioName: string;
    hasCycle: boolean;
    path: string[];
    lectureIds: string[];
    prereqIds: string[];
  }> {
    // Get the scenario data
    const scenario = circularDependencyScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioName} not found`);
    }

    // Create temporary lectures for the test
    const createdLectures: Record<string, any> = {};
    const createdPrereqs: string[] = [];
    let result;

    try {
      // Set up all the prerequisite relationships except the last one
      for (let i = 0; i < scenario.length - 1; i++) {
        const prereq = scenario[i];

        // Create any lectures that don't exist yet
        for (const id of [prereq.lectureId, prereq.prerequisiteLectureId]) {
          if (!createdLectures[id]) {
            const title = id.replace('lecture-', '').replace('-id', '');
            const lecture = await prisma.lecture.create({
              data: {
                title: `Test ${title}`,
                description: `Test lecture for ${title}`,
                contentUrl: `https://example.com/test/${title}`,
                lecturerName: 'Test Lecturer',
                contentType: 'test',
                category: 'test',
                order: 1,
                sourceAttribution: 'Test',
                preLecturePrompt: 'Test prompt',
                initialPrompt: 'Test prompt',
                masteryPrompt: 'Test prompt',
                evaluationPrompt: 'Test prompt',
                discussionPrompts: 'Test prompt'
              }
            });
            createdLectures[id] = lecture;
          }
        }

        // Create the prerequisite relationship
        const created = await prisma.lecturePrerequisite.create({
          data: {
            lectureId: createdLectures[prereq.lectureId].id,
            prerequisiteLectureId: createdLectures[prereq.prerequisiteLectureId].id,
            isRequired: prereq.isRequired ?? true,
            importanceLevel: prereq.importanceLevel ?? 3
          }
        });

        createdPrereqs.push(created.id);
      }

      // Get the last relationship, which should create a cycle
      const lastPrereq = scenario[scenario.length - 1];

      // Create lectures if needed
      for (const id of [lastPrereq.lectureId, lastPrereq.prerequisiteLectureId]) {
        if (!createdLectures[id]) {
          const title = id.replace('lecture-', '').replace('-id', '');
          const lecture = await prisma.lecture.create({
            data: {
              title: `Test ${title}`,
              description: `Test lecture for ${title}`,
              contentUrl: `https://example.com/test/${title}`,
              lecturerName: 'Test Lecturer',
              contentType: 'test',
              category: 'test',
              order: 1,
              sourceAttribution: 'Test',
              preLecturePrompt: 'Test prompt',
              initialPrompt: 'Test prompt',
              masteryPrompt: 'Test prompt',
              evaluationPrompt: 'Test prompt',
              discussionPrompts: 'Test prompt'
            }
          });
          createdLectures[id] = lecture;
        }
      }

      // Now check if adding the last relationship would create a cycle
      result = await LecturePrerequisiteController['checkCircularDependencies'](
        createdLectures[lastPrereq.lectureId].id,
        createdLectures[lastPrereq.prerequisiteLectureId].id
      );

      return {
        scenarioName,
        hasCycle: result.hasCycle,
        path: result.path,
        lectureIds: Object.values(createdLectures).map(l => l.id),
        prereqIds: createdPrereqs
      };
    } finally {
      // Clean up the test data
      await this.cleanupTestDependencyGraph(
        Object.values(createdLectures).map(l => l.id),
        createdPrereqs
      );
    }
  },

  /**
   * Simple script to test all dependency scenarios
   * This can be run manually during development
   */
  async runAllTests(): Promise<void> {
    console.log('Running dependency tests...');

    for (const scenario of Object.keys(circularDependencyScenarios) as Array<'directCircular' | 'indirectCircular' | 'selfReference'>) {
      console.log(`Testing scenario: ${scenario}`);
      try {
        const result = await this.testCircularDependencyDetection(scenario);
        console.log(`  - ${result.hasCycle ? 'Cycle detected! ✅' : 'No cycle detected ❌'}`);
        if (result.hasCycle) {
          console.log(`  - Path: ${result.path.join(' -> ')}`);
        }
      } catch (error) {
        console.error(`  - Error testing ${scenario}:`, error);
      }
    }
  }
};

/**
 * This function can be used to manually test the circular dependency detection
 * Run this from a script or debug console
 */
export async function testDependencyDetection(): Promise<void> {
  try {
    await DependencyTestHelper.runAllTests();
  } catch (error) {
    console.error('Error running dependency tests:', error);
  }
}
