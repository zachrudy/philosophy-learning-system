import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Test user data with timestamp to avoid conflicts
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`, // Unique email for each test run
    password: 'password123',
  };

  test('should register a new user, sign out, and sign back in', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Philosophy Learning System/);

    // Step 2: Go to signup page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);

    // Step 3: Fill signup form
    await page.getByPlaceholder('Full name').fill(testUser.name);
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder(/password.+8/i).fill(testUser.password);
    await page.getByPlaceholder('Confirm Password').fill(testUser.password);

    // Step 4: Submit the form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Step 5: Verify redirected to dashboard after successful signup
    // Add extra waiting time for auth processing
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Step 6: Find user profile menu and sign out
    // First letter of name is displayed as avatar - click on that
    const firstLetter = testUser.name.charAt(0).toUpperCase();

    // Using more robust selector for the avatar
    await page.waitForSelector(`div.rounded-full:has-text("${firstLetter}")`, { timeout: 5000 });
    await page.locator(`div.rounded-full:has-text("${firstLetter}")`).click();

    // Wait for menu to appear and click Sign Out
    await page.waitForSelector('text=Sign out', { timeout: 5000 });
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    // Step 7: Confirm sign out
    await page.waitForSelector('text=Are you sure you want to sign out?', { timeout: 5000 });
    await page.getByRole('button', { name: /yes, sign me out/i }).click();

    // Step 8: Verify redirected to home page
    await page.waitForURL(/\/$/, { timeout: 5000 });

    // Step 9: Navigate to sign in page
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Step 10: Fill sign in form
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Password').fill(testUser.password);

    // Step 11: Submit sign in form
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Step 12: Verify redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Step 13: Verify user is signed in (profile menu shows name initial)
    await expect(page.locator(`div.rounded-full:has-text("${firstLetter}")`)).toBeVisible({ timeout: 5000 });
  });

  test('should show error when signing in with invalid credentials', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Fill form with invalid credentials
    await page.getByPlaceholder('Email address').fill('nonexistent@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for error message - with waiting
    await page.waitForSelector('text=Invalid email or password', { timeout: 5000 });

    // Verify still on login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should enforce client-side validation on signup form', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/auth/signup');

    // Test password mismatch
    await page.getByPlaceholder('Full name').fill('Test User');
    await page.getByPlaceholder('Email address').fill('test@example.com');
    await page.getByPlaceholder(/password.+8/i).fill('password123');
    await page.getByPlaceholder('Confirm Password').fill('different-password');

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for error with waiting
    await page.waitForSelector('text=Passwords do not match', { timeout: 5000 });

    // Verify still on signup page
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test('should redirect to requested page after authentication', async ({ page }) => {
    // Try to access a protected page directly
    await page.goto('/profile');

    // Should be redirected to login with callback URL
    await page.waitForURL(/\/auth\/signin\?callbackUrl=/, { timeout: 5000 });

    // Sign in with valid credentials
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected to the originally requested page
    await page.waitForURL(/\/profile/, { timeout: 10000 });
  });
});
