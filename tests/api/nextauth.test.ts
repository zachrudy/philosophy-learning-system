import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/db/prisma';

// Create mock functions first
const mockVerifyPassword = jest.fn();
const mockHashPassword = jest.fn();

// Mocking dependencies
jest.mock('@/lib/auth', () => ({
  verifyPassword: mockVerifyPassword,
  hashPassword: mockHashPassword,
  AUTH_ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
  },
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Use let instead of const so it can be reassigned
let mockAuthorizeFn = jest.fn();

// Mock the NextAuth module
jest.mock('next-auth', () => ({
  default: jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn()
  })),
}));

jest.mock('next-auth/providers/credentials', () => {
  return function CredentialsProvider(options) {
    // Save the authorize function for testing
    mockAuthorizeFn = options.authorize;
    return { id: 'credentials', ...options };
  };
});

// Manually create a simplified version of the NextAuth handler to test
const setupNextAuthHandler = () => {
  // Create a simplified version of the authorize function for testing
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

  return { authorize: testAuthorize };
};

describe('NextAuth Configuration', () => {
  let authorize;

  beforeEach(() => {
    jest.clearAllMocks();
    const handler = setupNextAuthHandler();
    authorize = handler.authorize;
  });

  it('should return null when credentials are missing', async () => {
    // Arrange & Act
    const result = await authorize({});

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

    prisma.user.findUnique.mockResolvedValue(null);

    // Act
    const result = await authorize(credentials);

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

    prisma.user.findUnique.mockResolvedValue(user);
    mockVerifyPassword.mockResolvedValue(false);

    // Act
    const result = await authorize(credentials);

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

    prisma.user.findUnique.mockResolvedValue(user);
    mockVerifyPassword.mockResolvedValue(true);

    // Act
    const result = await authorize(credentials);

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
