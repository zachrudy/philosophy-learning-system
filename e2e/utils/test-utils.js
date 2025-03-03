/**
 * Bridge utility file to handle ES modules imports in CommonJS context
 */

// Import path to help with database connections
const path = require('path');
const fs = require('fs');

/**
 * Clear test users from the database
 */
async function clearTestUsers() {
  try {
    console.log('Cleaning up test users from database...');

    // Since we can't directly import the ES module, we'll implement the logic here
    // For SQLite database with Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.resolve(process.cwd(), 'prisma', 'test.db')}`
        }
      }
    });

    // Delete all users with emails that contain 'test-'
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
}

/**
 * Create a test user in the database
 */
async function createTestUser(userData) {
  try {
    console.log(`Creating test user: ${userData.email}`);

    // For SQLite database with Prisma
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.resolve(process.cwd(), 'prisma', 'test.db')}`
        }
      }
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

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
}

/**
 * Setup standard test users for e2e tests
 */
async function setupTestUsers() {
  try {
    // Define standard test users
    const adminUser = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'ADMIN'
    };

    const studentUser = {
      name: 'Student User',
      email: 'student@example.com',
      password: 'studentpassword',
      role: 'STUDENT'
    };

    // Create the users
    await createTestUser(adminUser);
    await createTestUser(studentUser);

    console.log('Test users created successfully');
  } catch (error) {
    console.error('Error setting up test users:', error);
  }
}

// Export functions using CommonJS syntax
module.exports = {
  clearTestUsers,
  createTestUser,
  setupTestUsers
};
