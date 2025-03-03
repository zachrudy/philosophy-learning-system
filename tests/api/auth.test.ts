import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '@/app/api/register/route';

// Mock auth utilities is already done in tests/setup.js

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration API', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockImplementationOnce(({ data }) => {
        return Promise.resolve({
          id: 'new-user-id',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const requestData = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const request = new NextRequest('http://localhost/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await registerHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData).not.toHaveProperty('password');
      expect(responseData.name).toBe(requestData.name);
      expect(responseData.email).toBe(requestData.email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: requestData.email }
      });
      expect(prisma.user.create).toHaveBeenCalled();
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

      prisma.user.findUnique.mockResolvedValueOnce(existingUser);

      const requestData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };

      const request = new NextRequest('http://localhost/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

      const request = new NextRequest('http://localhost/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

      const request = new NextRequest('http://localhost/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

      const request = new NextRequest('http://localhost/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
});
