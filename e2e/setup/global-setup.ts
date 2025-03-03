import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Use the bridge utility file (will create this in a separate file)
const testUtils = require('../utils/test-utils');

/**
 * This setup file will run before all tests.
 * It's used to prepare the test database.
 */
async function globalSetup(config: FullConfig) {
  console.log('Setting up test environment...');

  // Load appropriate environment variables
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

  // Environment variables for tests
  process.env.NODE_ENV = 'test';

  // Create a test database if needed
  setupTestDatabase();

  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), 'e2e/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Create an empty storage state file if it doesn't exist
  const storageStatePath = path.join(authDir, 'user.json');
  if (!fs.existsSync(storageStatePath)) {
    fs.writeFileSync(storageStatePath, JSON.stringify({
      cookies: [],
      origins: []
    }));
  }

  // Try to clear test users from previous runs
  try {
    await testUtils.clearTestUsers();
  } catch (error) {
    console.warn('Could not clear test users:', error);
    console.warn('This is expected on first run when database is not yet initialized');
  }

  console.log('Test environment setup complete');
}

/**
 * Setup a test database for running E2E tests
 */
function setupTestDatabase() {
  // Path to test database
  const testDbPath = path.resolve(process.cwd(), 'prisma', 'test.db');

  // If database exists, remove it first to ensure a clean state
  if (fs.existsSync(testDbPath)) {
    console.log('Removing existing test database...');
    fs.unlinkSync(testDbPath);
  }

  // Create a .env.test file if it doesn't exist
  const envTestPath = path.resolve(process.cwd(), '.env.test');
  if (!fs.existsSync(envTestPath)) {
    console.log('Creating .env.test file...');

    // Create test environment file with test database path
    fs.writeFileSync(
      envTestPath,
      `DATABASE_URL="file:./prisma/test.db"\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=test_secret_key`
    );
  }

  try {
    // Run prisma migrations on the test database
    console.log('Running Prisma migrations on test database...');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: 'file:./prisma/test.db' },
      stdio: 'inherit'
    });

    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

export default globalSetup;
