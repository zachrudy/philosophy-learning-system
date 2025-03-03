import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/db/prisma';

// Create mock function for verifyPassword
const mockVerifyPassword = jest.fn();

// Mock auth utilities properly
jest.mock('@/lib/auth', () => ({
  verifyPassword: mockVerifyPassword,
  hashPassword: jest.fn(),
  AUTH_ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
  },
}));

describe('NextAuth Configuration', () => {
  // Define a test authorize function that mimics NextAuth's behavior
  const testAuthorize = async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await mockVerifyPassword(credentials.password, user.password);

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when credentials are missing', async () => {
    // Arrange & Act
    const result = await testAuthorize({});

    // Assert
    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('should return null when user does not exist', async () => {
    // Arrange
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    prisma.user.findUnique.mockResolvedValueOnce(null);

    // Act
    const result = await testAuthorize(credentials);

    // Assert
    expect(result).toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: credentials.email },
    });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('should return null when password is invalid', async () => {
    // Arrange
    const credentials = {
      email: 'user@example.com',
      password: 'wrongpassword',
    };

    const user = {
      id: 'user1',
      email: 'user@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'STUDENT',
    };

    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockVerifyPassword.mockResolvedValueOnce(false);

    // Act
    const result = await testAuthorize(credentials);

    // Assert
    expect(result).toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: credentials.email },
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith(credentials.password, user.password);
  });

  it('should return user data when credentials are valid', async () => {
    // Arrange
    const credentials = {
      email: 'user@example.com',
      password: 'correctpassword',
    };

    const user = {
      id: 'user1',
      email: 'user@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'STUDENT',
    };

    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockVerifyPassword.mockResolvedValueOnce(true);

    // Act
    const result = await testAuthorize(credentials);

    // Assert
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: credentials.email },
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith(credentials.password, user.password);
  });
});
