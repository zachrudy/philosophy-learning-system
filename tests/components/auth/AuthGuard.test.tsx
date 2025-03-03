import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('AuthGuard', () => {
  const mockPush = jest.fn();
  const mockPathname = '/protected-route';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('should show loading state when checking authentication', () => {
    // Arrange
    (useSession as jest.Mock).mockReturnValue({
      status: 'loading',
      data: null,
    });

    // Act
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    // Arrange
    (useSession as jest.Mock).mockReturnValue({
      status: 'unauthenticated',
      data: null,
    });

    // Act
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Assert
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/signin?callbackUrl=${encodeURIComponent('/protected-route')}`
    );
  });

  it('should render children when user is authenticated', () => {
    // Arrange
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
      data: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          role: USER_ROLES.STUDENT,
        },
      },
    });

    // Act
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Assert
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should deny access when user role does not match required role', () => {
    // Arrange
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
      data: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          role: USER_ROLES.STUDENT,
        },
      },
    });

    // Act
    render(
      <AuthGuard requiredRole={USER_ROLES.ADMIN}>
        <div>Admin Content</div>
      </AuthGuard>
    );

    // Assert
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should allow access when user role matches required role', () => {
    // Arrange
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
      data: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          role: USER_ROLES.ADMIN,
        },
      },
    });

    // Act
    render(
      <AuthGuard requiredRole={USER_ROLES.ADMIN}>
        <div>Admin Content</div>
      </AuthGuard>
    );

    // Assert
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
