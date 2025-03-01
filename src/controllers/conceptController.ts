import { prisma } from '@/lib/db/prisma';
import { CreateConceptDTO, ConceptWithRelations } from '@/types/models';

export class ConceptController {
  /**
   * Get all concepts
   */
  static async getAllConcepts() {
    try {
      const concepts = await prisma.concept.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: concepts
      };
    } catch (error) {
      console.error('Error fetching concepts:', error);
      return {
        success: false,
        error: 'Failed to fetch concepts'
      };
    }
  }

  /**
   * Get concept by ID with its relationships
   */
  static async getConceptById(id: string) {
    try {
      const concept = await prisma.concept.findUnique({
        where: { id },
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

      if (!concept) {
        return {
          success: false,
          error: 'Concept not found'
        };
      }

      // Transform the data for a cleaner response
      const formattedConcept: ConceptWithRelations = {
        ...concept,
        prerequisites: concept.prerequisites.map(p => p.prerequisite),
        dependentConcepts: concept.dependentConcepts.map(d => d.dependentConcept),
      };

      return {
        success: true,
        data: formattedConcept
      };
    } catch (error) {
      console.error('Error fetching concept:', error);
      return {
        success: false,
        error: 'Failed to fetch concept'
      };
    }
  }

  /**
   * Create a new concept
   */
  static async createConcept(data: CreateConceptDTO) {
    try {
      const { name, description, prerequisiteIds } = data;

      // Start a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the concept
        const concept = await tx.concept.create({
          data: {
            name,
            description,
          },
        });

        // Add prerequisites if provided
        if (prerequisiteIds && prerequisiteIds.length > 0) {
          const prerequisitePromises = prerequisiteIds.map((prerequisiteId) =>
            tx.conceptPrerequisite.create({
              data: {
                prerequisiteId,
                dependentConceptId: concept.id,
                strength: 1, // Default strength
              },
            })
          );

          await Promise.all(prerequisitePromises);
        }

        return concept;
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error creating concept:', error);
      return {
        success: false,
        error: 'Failed to create concept'
      };
    }
  }

  /**
   * Update an existing concept
   */
  static async updateConcept(id: string, data: Partial<CreateConceptDTO>) {
    try {
      const { name, description, prerequisiteIds } = data;

      // Check if concept exists
      const existingConcept = await prisma.concept.findUnique({
        where: { id },
      });

      if (!existingConcept) {
        return {
          success: false,
          error: 'Concept not found',
        };
      }

      // Start a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update concept basic info
        const updatedConcept = await tx.concept.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description && { description }),
          },
        });

        // Update prerequisites if provided
        if (prerequisiteIds) {
          // Remove all existing prerequisites
          await tx.conceptPrerequisite.deleteMany({
            where: {
              dependentConceptId: id,
            },
          });

          // Add new prerequisites
          if (prerequisiteIds.length > 0) {
            const prerequisitePromises = prerequisiteIds.map((prerequisiteId) =>
              tx.conceptPrerequisite.create({
                data: {
                  prerequisiteId,
                  dependentConceptId: id,
                  strength: 1, // Default strength
                },
              })
            );

            await Promise.all(prerequisitePromises);
          }
        }

        return updatedConcept;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error updating concept:', error);
      return {
        success: false,
        error: 'Failed to update concept',
      };
    }
  }

  /**
   * Delete a concept
   */
  static async deleteConcept(id: string) {
    try {
      // Check if concept exists
      const existingConcept = await prisma.concept.findUnique({
        where: { id },
      });

      if (!existingConcept) {
        return {
          success: false,
          error: 'Concept not found',
        };
      }

      // Delete prerequisites relationships first
      await prisma.$transaction([
        prisma.conceptPrerequisite.deleteMany({
          where: {
            OR: [
              { prerequisiteId: id },
              { dependentConceptId: id },
            ],
          },
        }),
        prisma.concept.delete({
          where: { id },
        }),
      ]);

      return {
        success: true,
        message: 'Concept deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting concept:', error);
      return {
        success: false,
        error: 'Failed to delete concept',
      };
    }
  }
}
