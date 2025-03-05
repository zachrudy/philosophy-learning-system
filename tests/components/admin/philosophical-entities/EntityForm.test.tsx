// tests/components/admin/philosophical-entities/EntityForm.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import EntityForm from '@/components/admin/philosophical-entities/EntityForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('EntityForm Component', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  // Sample entity data for edit tests
  const mockEntity = {
    id: 'entity-1',
    type: 'Philosopher',
    name: 'Immanuel Kant',
    description: 'German philosopher',
    birthplace: 'Königsberg, Prussia',
    nationality: 'Prussian',
    biography: 'Kant created a new perspective in philosophy.',
    startDate: '1724-04-22',
    endDate: '1804-02-12',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    // Mock successful fetch for entity data in edit mode
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockEntity),
    });
  });

  it('renders create form correctly', () => {
    render(<EntityForm />);

    // Check heading indicates create mode
    expect(screen.getByText('Create New Philosophical Entity')).toBeInTheDocument();

    // Check for required fields
    expect(screen.getByLabelText('Entity Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // Check submit button text
    expect(screen.getByRole('button', { name: 'Create Entity' })).toBeInTheDocument();
  });

  it('renders edit form correctly when entityId is provided', async () => {
    render(<EntityForm entityId="entity-1" />);

    // Initially should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for entity data to load
    await waitFor(() => {
      expect(screen.getByText('Edit Philosophical Entity')).toBeInTheDocument();
    });

    // Check form is populated with entity data
    expect(screen.getByDisplayValue('Immanuel Kant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('German philosopher')).toBeInTheDocument();

    // Check type-specific fields for Philosopher
    expect(screen.getByDisplayValue('Königsberg, Prussia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Prussian')).toBeInTheDocument();

    // Check submit button text for edit mode
    expect(screen.getByRole('button', { name: 'Update Entity' })).toBeInTheDocument();
  });

  it('handles fetch error in edit mode', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ error: 'Entity not found' }),
    });

    render(<EntityForm entityId="nonexistent-id" />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch entity')).toBeInTheDocument();
    });
  });

  it('shows different fields based on entity type selection', () => {
    render(<EntityForm />);

    // Start with default Philosopher type
    expect(screen.getByLabelText('Birthplace')).toBeInTheDocument();
    expect(screen.getByLabelText('Nationality')).toBeInTheDocument();
    expect(screen.getByLabelText('Biography')).toBeInTheDocument();

    // Change to PhilosophicalConcept
    const typeSelect = screen.getByLabelText('Entity Type');
    fireEvent.change(typeSelect, { target: { value: 'PhilosophicalConcept' } });

    // Check for concept fields
    expect(screen.getByLabelText('Primary Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Key Terms (comma-separated)')).toBeInTheDocument();

    // Change to Problematic
    fireEvent.change(typeSelect, { target: { value: 'Problematic' } });

    // Check for problematic fields
    expect(screen.getByLabelText('Central Question')).toBeInTheDocument();
    expect(screen.getByLabelText('Still Relevant')).toBeInTheDocument();
  });

  it('handles form submission for creating a new entity', async () => {
    // Mock successful entity creation
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'new-entity-id',
        type: 'Philosopher',
        name: 'Socrates',
        description: 'Greek philosopher',
      }),
    });

    render(<EntityForm />);

    // Fill out form fields
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Socrates' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Greek philosopher' } });
    fireEvent.change(screen.getByLabelText('Birthplace'), { target: { value: 'Athens, Greece' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Entity' }));

    // Verify loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();

    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/philosophical-entities',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
    });

    // Check that JSON payload includes the correct data
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody).toEqual(expect.objectContaining({
      type: 'Philosopher',
      name: 'Socrates',
      description: 'Greek philosopher',
      birthplace: 'Athens, Greece',
    }));

    // Check success message and redirection
    await waitFor(() => {
      expect(screen.getByText('Entity created successfully')).toBeInTheDocument();
    });

    // Should redirect after a delay
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/philosophical-entities/new-entity-id');
    }, { timeout: 2000 });
  });

  it('handles form submission for updating an entity', async () => {
    // Mock successful entity update
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'entity-1',
            type: 'Philosopher',
            name: 'Immanuel Kant',
            description: 'Updated description',
          }),
        });
      }
      // For initial data fetching
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEntity),
      });
    });

    render(<EntityForm entityId="entity-1" />);

    // Wait for form to load with entity data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Immanuel Kant')).toBeInTheDocument();
    });

    // Update description field
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Update Entity' }));

    // Verify loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();

    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/philosophical-entities/entity-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(String),
        })
      );
    });

    // Check that JSON payload includes the updated data
    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    const updateCall = fetchCalls.find(call => call[1]?.method === 'PATCH');
    const requestBody = JSON.parse(updateCall[1].body);
    expect(requestBody).toEqual(expect.objectContaining({
      description: 'Updated description',
    }));

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Entity updated successfully')).toBeInTheDocument();
    });

    // Should refresh the page
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('handles API errors on form submission', async () => {
    // Mock API error response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'Invalid entity data' }),
    });

    render(<EntityForm />);

    // Fill minimal required fields
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Entity' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Entity' }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid entity data')).toBeInTheDocument();
    });

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('properly handles key terms input', async () => {
    // Mock successful entity creation
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'new-concept-id',
        type: 'PhilosophicalConcept',
        name: 'Categorical Imperative',
        keyTerms: ['ethics', 'morality', 'duty'],
      }),
    });

    render(<EntityForm />);

    // Change to PhilosophicalConcept
    const typeSelect = screen.getByLabelText('Entity Type');
    fireEvent.change(typeSelect, { target: { value: 'PhilosophicalConcept' } });

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Categorical Imperative' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Ethical concept from Kant' } });

    // Add comma-separated key terms
    fireEvent.change(screen.getByLabelText('Key Terms (comma-separated)'), {
      target: { value: 'ethics, morality, duty' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Entity' }));

    // Verify request payload
    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.keyTerms).toEqual(['ethics', 'morality', 'duty']);
    });
  });

  it('handles cancellation and returns to entity list', () => {
    render(<EntityForm />);

    // Click the cancel button
    fireEvent.click(screen.getByRole('link', { name: 'Cancel' }));

    // Should link to the entity list
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/admin/philosophical-entities'
    );
  });
});
