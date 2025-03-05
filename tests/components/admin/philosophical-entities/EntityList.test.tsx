// tests/components/admin/philosophical-entities/EntityList.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EntityList from '@/components/admin/philosophical-entities/EntityList';
import { USER_ROLES } from '@/lib/constants';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('EntityList Component', () => {
  // Setup common mocks
  const mockPush = jest.fn();
  const mockEntities = [
    {
      id: 'entity-1',
      type: 'Philosopher',
      name: 'Immanuel Kant',
      description: 'German philosopher',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'entity-2',
      type: 'PhilosophicalConcept',
      name: 'Categorical Imperative',
      description: 'Ethical concept developed by Kant',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Mock authenticated admin session by default
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: USER_ROLES.ADMIN,
        },
      },
      status: 'authenticated',
    });

    // Mock successful fetch response by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: mockEntities,
        pagination: mockPagination,
      }),
    });
  });

  it('redirects to dashboard if user is not authorized', async () => {
    // Mock non-admin session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          name: 'Regular User',
          email: 'user@example.com',
          role: USER_ROLES.STUDENT,
        },
      },
      status: 'authenticated',
    });

    render(<EntityList />);

    // Verify redirection
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state initially', () => {
    render(<EntityList />);

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays entities after loading', async () => {
    render(<EntityList />);

    // Wait for entities to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
      expect(screen.getByText('Categorical Imperative')).toBeInTheDocument();
    });

    // Check for entity types
    expect(screen.getByText('Philosopher')).toBeInTheDocument();
    expect(screen.getByText('PhilosophicalConcept')).toBeInTheDocument();
  });

  it('handles entity search and filtering', async () => {
    render(<EntityList />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Philosophical Entities')).toBeInTheDocument();
    });

    // Find input and select fields
    const searchInput = screen.getByPlaceholderText('Search by name or description');
    const typeSelect = screen.getByLabelText('Type');
    const filterButton = screen.getByRole('button', { name: 'Filter' });

    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'Kant' } });

    // Select a type filter
    fireEvent.change(typeSelect, { target: { value: 'Philosopher' } });

    // Click filter button
    fireEvent.click(filterButton);

    // Verify fetch was called with the right params
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?page=1&limit=10&type=Philosopher&search=Kant')
      );
    });
  });

  it('handles pagination', async () => {
    // Mock more entities for pagination
    const mockPaginatedResponse = {
      data: mockEntities,
      pagination: {
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPaginatedResponse),
    });

    render(<EntityList />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Philosophical Entities')).toBeInTheDocument();
    });

    // Find next page button and click it
    const nextPageButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextPageButton);

    // Verify fetch was called with page=2
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('handles entity deletion', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    // Mock successful delete response
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Entity deleted successfully' }),
        });
      }
      // For initial data fetching
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: mockEntities,
          pagination: mockPagination,
        }),
      });
    });

    render(<EntityList />);

    // Wait for entities to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Find and click delete button for first entity
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion dialog should be shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify fetch was called with DELETE method
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/philosophical-entities/entity-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    // Verify data is refreshed after deletion
    await waitFor(() => {
      // Should call fetch again to get updated data
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial load + delete + refresh
    });
  });

  it('handles error states', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: 'Failed to fetch entities',
      }),
    });

    render(<EntityList />);

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch entities')).toBeInTheDocument();
    });

    // Try again button should be present
    const tryAgainButton = screen.getByText('Try again');
    expect(tryAgainButton).toBeInTheDocument();

    // Click try again and verify fetch is called again
    fireEvent.click(tryAgainButton);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
