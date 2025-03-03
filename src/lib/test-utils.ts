/**
 * Utility functions for testing
 */

/**
 * Clears test users from the database.
 * Useful for cleaning up after tests.
 */
export const clearTestUsers = async () => {
  try {
    console.log('Cleaning up test users from database...');

    // Import prisma client
    const { prisma } = await import('@/lib/db/prisma');

    // Delete all users with emails that contain 'test-'
    // which should catch all our test users
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });

    console.log(`Removed ${result.count} test users`);

    // Close the connection to prevent hanging
    await prisma.$disconnect();

    return result.count;
  } catch (error) {
    console.error('Error clearing test users:', error);
    throw error;
  }
};

/**
 * Create a test user directly via the database
 * Useful for setting up test data without going through the UI
 */
export const createTestUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    // Import prisma client and auth utilities
    const { prisma } = await import('@/lib/db/prisma');
    const { hashPassword } = await import('@/lib/auth');

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'STUDENT',
      },
    });

    // Close the connection to prevent hanging
    await prisma.$disconnect();

    // Return the created user (without password)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};
