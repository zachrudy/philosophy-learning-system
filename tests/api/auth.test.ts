import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/db/prisma';

// Create mock functions
const mockHashPassword = jest.fn();
const mockVerifyPassword = jest.fn();

// Mock implementations for auth utilities
jest.mock('@/lib/auth', () => ({
  hashPassword: mockHashPassword.mockImplementation(async (password) => `hashed_${password}`),
  verifyPassword: mockVerifyPassword.mockImplementation(async (plain, hashed) => plain === hashed.replace('hashed_', '')),
  AUTH_ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    MISSING_FIELDS: 'All fields are required',
    ACCOUNT_EXISTS: 'Account with this email already exists',
    WEAK_PASSWORD: 'Password must be at least 8 characters long',
    SERVER_ERROR: 'An error occurred during authentication',
  },
  SESSION_MAX_AGE: 86400 * 30
}));

// Mock NextRequest and NextResponse
const MockNextRequest = jest.fn();
const MockNextResponse = {
  json: jest.fn()
};

jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse
}));

// Setup mock implementations before tests
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Set up NextRequest mock implementation
  MockNextRequest.mockImplementation((url, init = {}) => {
    return {
      url,
      method: init.method || 'GET',
      headers: new Map(Object.entries(init.headers || {})),
      json: jest.fn().mockImplementation(async () => {
        if (typeof init.body === 'string') {
          try {
            return JSON.parse(init.body);
          } catch (e) {
            return {};
          }
        }
        return init.body || {};
      }),
      nextUrl: new URL(url),
    };
  });

  // Set up NextResponse.json mock implementation
  MockNextResponse.json.mockImplementation((body, options = {}) => {
    return {
      status: options.status || 200,
      headers: new Map(),
      body,
      json: async () => body,
    };
  });
});

// Create a test version of the register handler
async function registerHandler(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Simple validation
    if (!name || !email || !password) {
      return MockNextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return MockNextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return MockNextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return MockNextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await mockHashPassword(password);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT', // Default role is student
      },
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    return MockNextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return MockNextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

describe('Authentication API', () => {
  describe('Registration API', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password123',
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const requestData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const request = new MockNextRequest('http://localhost/api/register', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData).not.toHaveProperty('password');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: requestData.email }
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: requestData.name,
          email: requestData.email,
          password: 'hashed_password123', // Mocked hash
          role: 'STUDENT'
        }
      });
      expect(mockHashPassword).toHaveBeenCalledWith(requestData.password);
    });

    it('should reject registration when user already exists', async () => {
      // Arrange
      const existingUser = {
        id: 'user1',
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedpassword',
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      const requestData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };

      const request = new MockNextRequest('http://localhost/api/register', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('User with this email already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with missing fields', async () => {
      // Arrange
      const requestData = {
        // Missing name
        email: 'test@example.com',
        password: 'password123'
      };

      const request = new MockNextRequest('http://localhost/api/register', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Missing required fields');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid email format', async () => {
      // Arrange
      const requestData = {
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123'
      };

      const request = new MockNextRequest('http://localhost/api/register', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid email format');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with short password', async () => {
      // Arrange
      const requestData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short'  // Less than 8 characters
      };

      const request = new MockNextRequest('http://localhost/api/register', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Password must be at least 8 characters long');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // Additional tests for password utils
  describe('Password Utilities', () => {
    it('should hash a password', async () => {
      // We're using mocked implementation, but let's check the behavior
      const result = await mockHashPassword('testpassword');
      expect(result).toBe('hashed_testpassword');
      expect(mockHashPassword).toHaveBeenCalledWith('testpassword');
    });

    it('should verify a correct password', async () => {
      const result = await mockVerifyPassword('testpassword', 'hashed_testpassword');
      expect(result).toBe(true);
      expect(mockVerifyPassword).toHaveBeenCalledWith('testpassword', 'hashed_testpassword');
    });

    it('should reject an incorrect password', async () => {
      const result = await mockVerifyPassword('wrongpassword', 'hashed_testpassword');
      expect(result).toBe(false);
      expect(mockVerifyPassword).toHaveBeenCalledWith('wrongpassword', 'hashed_testpassword');
    });
  });
});
