import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Test user data
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`, // Generate unique email
    password: 'password123',
  };

  test('should register a new user, sign out, and sign back in', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');

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
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 6: Find user profile menu and sign out
    await page.getByText(testUser.name[0].toUpperCase()).click(); // First letter avatar
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    // Step 7: Confirm sign out
    await page.getByRole('button', { name: /sign me out/i }).click();

    // Step 8: Verify redirected to home page
    await expect(page).toHaveURL(/\/$/);

    // Step 9: Navigate to sign in page
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Step 10: Fill sign in form
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Password').fill(testUser.password);

    // Step 11: Submit sign in form
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Step 12: Verify redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 13: Verify user is signed in (profile menu shows name initial)
    await expect(page.getByText(testUser.name[0].toUpperCase())).toBeVisible();
  });

  test('should show error when signing in with invalid credentials', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Fill form with invalid credentials
    await page.getByPlaceholder('Email address').fill('nonexistent@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should enforce client-side validation on signup form', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/auth/signup');

    // Test empty form submission
    await page.getByRole('button', { name: /sign up/i }).click();
    // Should show validation errors (HTML5 validation)

    // Test password mismatch
    await page.getByPlaceholder('Full name').fill('Test User');
    await page.getByPlaceholder('Email address').fill('test@example.com');
    await page.getByPlaceholder(/password.+8/i).fill('password123');
    await page.getByPlaceholder('Confirm Password').fill('different-password');

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();

    // Verify still on signup page
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test('should redirect to requested page after authentication', async ({ page }) => {
    // Try to access a protected page directly
    await page.goto('/profile');

    // Should be redirected to login with callback URL
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=/);

    // Sign in with valid credentials
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected to the originally requested page
    await expect(page).toHaveURL(/\/profile/);
  });
});
