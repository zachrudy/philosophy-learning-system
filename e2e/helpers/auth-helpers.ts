import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Authentication helpers for Playwright tests
 */

// User roles for tests
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@example.com',
    password: 'adminpassword',
    name: 'Admin User',
    role: 'ADMIN'
  },
  STUDENT: {
    email: 'student@example.com',
    password: 'studentpassword',
    name: 'Student User',
    role: 'STUDENT'
  }
};

/**
 * Create a new test user via the signup form
 */
export async function createTestUser(page: Page, userData: { name: string, email: string, password: string }) {
  // Navigate to signup page
  await page.goto('/auth/signup');

  // Fill out the form
  await page.getByPlaceholder('Full name').fill(userData.name);
  await page.getByPlaceholder('Email address').fill(userData.email);
  await page.getByPlaceholder(/password.+8/i).fill(userData.password);
  await page.getByPlaceholder('Confirm Password').fill(userData.password);

  // Submit the form
  await page.getByRole('button', { name: /sign up/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Login a user and save the authentication state
 */
export async function loginUser(page: Page, userData: { email: string, password: string }, saveAuthState = true) {
  // Navigate to signin page
  await page.goto('/auth/signin');

  // Fill sign in form
  await page.getByPlaceholder('Email address').fill(userData.email);
  await page.getByPlaceholder('Password').fill(userData.password);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation to complete - with longer timeout for auth processing
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // Save auth state for future use if requested
  if (saveAuthState) {
    // Make sure directory exists
    const authDir = path.join(process.cwd(), 'e2e/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save the storage state (cookies, localStorage)
    await page.context().storageState({
      path: path.join(authDir, 'user.json')
    });
  }
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Get the user's initials from the profile menu
  const profileButton = page.locator('div.rounded-full');
  await profileButton.waitFor({ state: 'visible', timeout: 5000 });
  await profileButton.click();

  // Wait for menu to appear
  await page.waitForSelector('text=Sign out', { timeout: 5000 });

  // Click sign out button
  await page.getByText('Sign out').click();

  // Confirm sign out
  await page.waitForSelector('text=Are you sure you want to sign out?', { timeout: 5000 });
  await page.getByRole('button', { name: /yes, sign me out/i }).click();

  // Wait for redirect to home page
  await page.waitForURL(/\/$/, { timeout: 5000 });
}

/**
 * Utility to clear auth state
 */
export function clearAuthState() {
  const authStatePath = path.join(process.cwd(), 'e2e/.auth/user.json');
  if (fs.existsSync(authStatePath)) {
    fs.unlinkSync(authStatePath);
  }
}

/**
 * Setup standard test users for e2e tests
 * This can be called from globalSetup to ensure test users exist
 */
export async function setupTestUsers() {
  try {
    // Dynamically import the createTestUser utility
    const { createTestUser } = await import('../../src/lib/test-utils');

    // Create admin user
    await createTestUser({
      name: TEST_USERS.ADMIN.name,
      email: TEST_USERS.ADMIN.email,
      password: TEST_USERS.ADMIN.password,
      role: TEST_USERS.ADMIN.role
    });

    // Create student user
    await createTestUser({
      name: TEST_USERS.STUDENT.name,
      email: TEST_USERS.STUDENT.email,
      password: TEST_USERS.STUDENT.password,
      role: TEST_USERS.STUDENT.role
    });

    console.log('Test users created successfully');
  } catch (error) {
    console.error('Error setting up test users:', error);
  }
}
