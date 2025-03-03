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
  await page.waitForURL(/\/dashboard/);
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

  // Wait for navigation to complete
  await page.waitForURL(/\/dashboard/);

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
  // Click on the user menu
  await page.getByRole('button', { name: /user menu/i }).click();

  // Click sign out button
  await page.getByRole('menuitem', { name: /sign out/i }).click();

  // Confirm sign out
  await page.getByRole('button', { name: /yes, sign me out/i }).click();

  // Wait for redirect to home page
  await page.waitForURL(/\/$/);
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
