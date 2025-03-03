import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword } from '@/lib/auth';

// We need to mock bcryptjs to avoid actual CPU-intensive hashing during tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((password, salt) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((plain, hashed) => Promise.resolve(hashed === `hashed_${plain}`)),
}));

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      // Arrange
      const password = 'securepassword';
      const expectedHash = 'hashed_securepassword';

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result).toBe(expectedHash);
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password matches the hash', async () => {
      // Arrange
      const password = 'securepassword';
      const hash = 'hashed_securepassword';

      // Act
      const result = await verifyPassword(password, hash);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when password does not match the hash', async () => {
      // Arrange
      const password = 'wrongpassword';
      const hash = 'hashed_securepassword';

      // Act
      const result = await verifyPassword(password, hash);

      // Assert
      expect(result).toBe(false);
    });
  });
});
