// tests/components/admin/philosophical-entities/EntityDetail.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import EntityDetail from '@/components/admin/philosophical-entities/EntityDetail';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('EntityDetail Component', () => {
  // Setup common test data
  const mockPhilosopher = {
    id: 'philosopher-1',
    type: 'Philosopher',
    name: 'Immanuel Kant',
    description: 'German philosopher who is a central figure in modern philosophy.',
    birthplace: 'Königsberg, Prussia',
    nationality: 'Prussian',
    biography: 'Kant created a new perspective in philosophy.',
    startDate: '1724-04-22T00:00:00.000Z',
    endDate: '1804-02-12T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    relationships: [
      {
        id: 'relation-1',
        direction: 'outgoing',
        relationTypes: ['DEVELOPMENT'],
        description: 'Developed by Kant',
        relatedEntity: {
          id: 'concept-1',
          name: 'Categorical Imperative',
          type: 'PhilosophicalConcept',
        },
      },
    ],
  };

  const mockConcept = {
    id: 'concept-1',
    type: 'PhilosophicalConcept',
    name: 'Categorical Imperative',
    description: 'A central philosophical concept from Kant\'s ethics.',
    primaryText: 'Groundwork of the Metaphysic of Morals',
    keyTerms: ['ethics', 'duty', 'universalizability'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    relationships: [
      {
        id: 'relation-2',
        direction: 'incoming',
        relationTypes: ['DEVELOPMENT'],
        description: 'Developed by Kant',
        relatedEntity: {
          id: 'philosopher-1',
          name: 'Immanuel Kant',
          type: 'Philosopher',
        },
      },
    ],
  };

  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Default: Mock successful philosopher fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPhilosopher),
    });
  });

  it('displays loading state initially', () => {
    render(<EntityDetail entityId="philosopher-1" />);

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays philosopher entity details correctly', async () => {
    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Check for type-specific philosopher fields
    expect(screen.getByText('Philosopher')).toBeInTheDocument();
    expect(screen.getByText('Königsberg, Prussia')).toBeInTheDocument();
    expect(screen.getByText('Prussian')).toBeInTheDocument();
    expect(screen.getByText('Kant created a new perspective in philosophy.')).toBeInTheDocument();

    // Check for relationship information
    expect(screen.getByText('Categorical Imperative')).toBeInTheDocument();
    expect(screen.getByText('DEVELOPMENT')).toBeInTheDocument();
    expect(screen.getByText('Outgoing')).toBeInTheDocument();
  });

  it('displays philosophical concept entity details correctly', async () => {
    // Override the mock to return a concept
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockConcept),
    });

    render(<EntityDetail entityId="concept-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Categorical Imperative')).toBeInTheDocument();
    });

    // Check for type-specific concept fields
    expect(screen.getByText('PhilosophicalConcept')).toBeInTheDocument();
    expect(screen.getByText('Groundwork of the Metaphysic of Morals')).toBeInTheDocument();

    // Check for key terms
    expect(screen.getByText('ethics')).toBeInTheDocument();
    expect(screen.getByText('duty')).toBeInTheDocument();
    expect(screen.getByText('universalizability')).toBeInTheDocument();

    // Check for relationship information
    expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    expect(screen.getByText('Incoming')).toBeInTheDocument();
  });

  it('handles entity not found', async () => {
    // Mock fetch to return null
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(null),
    });

    render(<EntityDetail entityId="nonexistent-id" />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Entity not found')).toBeInTheDocument();
    });

    // Should have a link to go back to entity list
    expect(screen.getByText('Return to entity list')).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Failed to fetch entity' }),
    });

    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch entity')).toBeInTheDocument();
    });

    // Should have a try again button
    const tryAgainButton = screen.getByText('Try again');
    expect(tryAgainButton).toBeInTheDocument();

    // Clicking try again should call fetch again
    fireEvent.click(tryAgainButton);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles entity deletion', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    // Mock delete response
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
        json: () => Promise.resolve(mockPhilosopher),
      });
    });

    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion dialog should be shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify fetch was called with DELETE method
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/philosophical-entities/philosopher-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    // Should redirect to entity list
    expect(mockPush).toHaveBeenCalledWith('/admin/philosophical-entities');
  });

  it('does not delete when canceling confirmation', async () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn().mockReturnValue(false);

    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion dialog should be shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify DELETE fetch was not called
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial data fetch
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Find and click refresh button (looks for the button with refresh icon)
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);

    // Verify fetch was called again
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('deletes a relationship', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    // Mock fetch for relationship deletion
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/api/philosophical-relationships/') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Relationship deleted successfully' }),
        });
      }
      // For initial and refresh data fetching
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPhilosopher),
      });
    });

    render(<EntityDetail entityId="philosopher-1" />);

    // Wait for entity to load
    await waitFor(() => {
      expect(screen.getByText('Immanuel Kant')).toBeInTheDocument();
    });

    // Find and click delete button for relationship
    const relationshipDeleteButtons = screen.getAllByText('Delete');
    // The first Delete is for the entity, the second is for the relationship
    fireEvent.click(relationshipDeleteButtons[1]);

    // Confirm deletion dialog should be shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify fetch was called with DELETE method for relationship
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/philosophical-relationships/relation-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    // Should refresh entity data
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + delete + refresh
  });
});
