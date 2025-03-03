import bcrypt from 'bcryptjs';  // Changed from 'bcrypt' to 'bcryptjs'

// Constants for authentication
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_FIELDS: 'All fields are required',
  ACCOUNT_EXISTS: 'Account with this email already exists',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  SERVER_ERROR: 'An error occurred during authentication',
};

// Session constants
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
