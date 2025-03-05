// tests/components/admin/philosophical-entities/RelationshipForm.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RelationshipForm from '@/components/admin/philosophical-entities/RelationshipForm';
import { RELATION_TYPES } from '@/lib/constants';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('RelationshipForm Component', () => {
  const mockPush = jest.fn();

  // Sample entities for dropdown options
  const mockEntities = [
    {
      id: 'philosopher-1',
      name: 'Immanuel Kant',
      type: 'Philosopher',
    },
    {
      id: 'concept-1',
      name: 'Categorical Imperative',
      type: 'PhilosophicalConcept',
    },
    {
      id: 'branch-1',
      name: 'Ethics',
      type: 'Branch',
    },
  ];

  // Sample relationship data for edit tests
  const mockRelationship = {
    id: 'relation-1',
    sourceEntityId: 'philosopher-1',
    targetEntityId: 'concept-1',
    relationTypes: ['DEVELOPMENT'],
    description: 'Kant developed the Categorical Imperative',
    importance: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Mock successful fetch for entities list
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: mockEntities,
        pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
      }),
    });
  });

  describe('Rendering', () => {
    it('renders create form correctly', async () => {
      render(<RelationshipForm />);

      // Initially show loading state for entities
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByText('Create New Relationship')).toBeInTheDocument();
      });

      // Check for required fields
      expect(screen.getByLabelText('Source Entity')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Entity')).toBeInTheDocument();
      expect(screen.getByLabelText('Relation Types')).toBeInTheDocument();

      // Check submit button text
      expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
    });

    it('renders with pre-selected source entity when sourceEntityId is provided', async () => {
      render(<RelationshipForm sourceEntityId="philosopher-1" />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByText('Create New Relationship')).toBeInTheDocument();
      });

      // Check source entity is selected and disabled
      const sourceSelect = screen.getByLabelText('Source Entity') as HTMLSelectElement;
      expect(sourceSelect.value).toBe('philosopher-1');
      expect(sourceSelect).toBeDisabled();

      // Target entity should be enabled
      const targetSelect = screen.getByLabelText('Target Entity') as HTMLSelectElement;
      expect(targetSelect).not.toBeDisabled();
    });

    it('renders edit form correctly when relationshipId is provided', async () => {
      // Mock fetch for existing relationship
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/philosophical-relationships/relation-1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRelationship),
          });
        }
        // Default response for entities fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockEntities,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
          }),
        });
      });

      render(<RelationshipForm relationshipId="relation-1" />);

      // Wait for relationship data to load
      await waitFor(() => {
        expect(screen.getByText('Edit Relationship')).toBeInTheDocument();
      });

      // Check form is populated with relationship data
      const sourceSelect = screen.getByLabelText('Source Entity') as HTMLSelectElement;
      const targetSelect = screen.getByLabelText('Target Entity') as HTMLSelectElement;
      const descriptionField = screen.getByLabelText('Description') as HTMLTextAreaElement;

      expect(sourceSelect.value).toBe('philosopher-1');
      expect(targetSelect.value).toBe('concept-1');
      expect(descriptionField.value).toBe('Kant developed the Categorical Imperative');

      // Check both entity selects are disabled in edit mode
      expect(sourceSelect).toBeDisabled();
      expect(targetSelect).toBeDisabled();

      // Check submit button text for edit mode
      expect(screen.getByRole('button', { name: 'Update Relationship' })).toBeInTheDocument();
    });
  });

  describe('Entity Selection', () => {
    it('populates entity dropdowns with fetched data', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByText('Create New Relationship')).toBeInTheDocument();
      });

      // Check that dropdown options are populated
      // First option is the placeholder
      expect(screen.getByText('Select Source Entity')).toBeInTheDocument();

      // Entity options should be present
      expect(screen.getByText('Immanuel Kant (Philosopher)')).toBeInTheDocument();
      expect(screen.getByText('Categorical Imperative (PhilosophicalConcept)')).toBeInTheDocument();
      expect(screen.getByText('Ethics (Branch)')).toBeInTheDocument();
    });

    it('filters target entity options to exclude selected source entity', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByText('Immanuel Kant (Philosopher)')).toBeInTheDocument();
      });

      // Select a source entity
      const sourceSelect = screen.getByLabelText('Source Entity');
      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });

      // Check target entity options
      const targetSelect = screen.getByLabelText('Target Entity') as HTMLSelectElement;

      // Should not be able to select the same entity as target
      expect(Array.from(targetSelect.options).map(opt => opt.value)).not.toContain('philosopher-1');

      // Other entities should still be available
      expect(screen.getAllByText('Categorical Imperative (PhilosophicalConcept)')).toHaveLength(1);
      expect(screen.getAllByText('Ethics (Branch)')).toHaveLength(1);
    });
  });

  describe('Relation Type Selection', () => {
    it('allows selecting multiple relation types', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByLabelText('Relation Types')).toBeInTheDocument();
      });

      // Select multiple relation types
      const relationTypesSelect = screen.getByLabelText('Relation Types') as HTMLSelectElement;

      // Mock selection of multiple options
      // Note: fireEvent doesn't fully support multi-select, so we're directly setting the value
      fireEvent.change(relationTypesSelect, {
        target: {
          options: [
            { value: 'DEVELOPMENT', selected: true },
            { value: 'ADDRESSES_PROBLEMATIC', selected: true }
          ]
        }
      });

      // Update formData to reflect selected options
      expect(relationTypesSelect.multiple).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('validates required fields before submission', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
      });

      // Submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Should show validation errors
      // Note: The exact error messages depend on your form validation implementation
      // The test will rely on your DOM structure and validation feedback mechanisms

      // Check if fetch was not called due to validation errors
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/philosophical-relationships',
        expect.any(Object)
      );
    });

    it('validates source and target must be different', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
      });

      // Set same source and target (need to bypass the UI filtering)
      // We'll do this by directly setting formData values, which doesn't actually happen in the UI
      // but we're testing the validation logic
      const sourceSelect = screen.getByLabelText('Source Entity');
      const targetSelect = screen.getByLabelText('Target Entity');

      // Select source entity
      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });

      // Hack the target to be the same (normally UI prevents this)
      Object.defineProperty(targetSelect, 'value', {
        value: 'philosopher-1',
        writable: true
      });

      // Select a relation type (required field)
      const relationTypesSelect = screen.getByLabelText('Relation Types');
      fireEvent.change(relationTypesSelect, {
        target: {
          options: [{ value: 'DEVELOPMENT', selected: true }]
        }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Source and target entities must be different')).toBeInTheDocument();
      });

      // Fetch should not be called
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/philosophical-relationships',
        expect.any(Object)
      );
    });

    it('validates at least one relation type is selected', async () => {
      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
      });

      // Fill required fields but skip relation types
      const sourceSelect = screen.getByLabelText('Source Entity');
      const targetSelect = screen.getByLabelText('Target Entity');

      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });
      fireEvent.change(targetSelect, { target: { value: 'concept-1' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Please select at least one relation type')).toBeInTheDocument();
      });

      // Fetch should not be called
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/philosophical-relationships',
        expect.any(Object)
      );
    });

    it('successfully submits new relationship data', async () => {
      // Mock successful creation response
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/philosophical-relationships' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'new-relation-id',
              sourceEntityId: 'philosopher-1',
              targetEntityId: 'concept-1',
              relationTypes: ['DEVELOPMENT'],
              description: 'Test description',
              importance: 3
            }),
          });
        }
        // Default response for entities fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockEntities,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
          }),
        });
      });

      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
      });

      // Fill all required fields
      const sourceSelect = screen.getByLabelText('Source Entity');
      const targetSelect = screen.getByLabelText('Target Entity');
      const relationTypesSelect = screen.getByLabelText('Relation Types');
      const descriptionField = screen.getByLabelText('Description');

      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });
      fireEvent.change(targetSelect, { target: { value: 'concept-1' } });
      fireEvent.change(relationTypesSelect, {
        target: {
          options: [{ value: 'DEVELOPMENT', selected: true }]
        }
      });
      fireEvent.change(descriptionField, { target: { value: 'Test description' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Verify loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();

      // Verify fetch call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/philosophical-relationships',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(String),
          })
        );
      });

      // Check request payload
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[0] === '/api/philosophical-relationships'
      );
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT'],
        description: 'Test description',
        importance: 3 // Default value
      });

      // Check success message and redirection
      await waitFor(() => {
        expect(screen.getByText('Relationship created successfully')).toBeInTheDocument();
      });

      // Should redirect after a delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/philosophical-entities/philosopher-1');
      }, { timeout: 2000 });
    });

    it('successfully updates an existing relationship', async () => {
      // Mock fetch responses for edit mode
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/philosophical-relationships/relation-1') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockRelationship,
              description: 'Updated description',
              importance: 4
            }),
          });
        }
        if (url.includes('/api/philosophical-relationships/relation-1') && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRelationship),
          });
        }
        // Default response for entities fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockEntities,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
          }),
        });
      });

      render(<RelationshipForm relationshipId="relation-1" />);

      // Wait for relationship data to load
      await waitFor(() => {
        expect(screen.getByText('Edit Relationship')).toBeInTheDocument();
      });

      // Update description field
      const descriptionField = screen.getByLabelText('Description');
      fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

      // Update importance slider
      const importanceSlider = screen.getByLabelText('Importance (1-5)');
      fireEvent.change(importanceSlider, { target: { value: 4 } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Update Relationship' }));

      // Verify loading state
      expect(screen.getByText('Updating...')).toBeInTheDocument();

      // Verify fetch call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/philosophical-relationships/relation-1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.any(String),
          })
        );
      });

      // Check request payload
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const updateCall = fetchCalls.find(
        call => call[0].includes('/api/philosophical-relationships/relation-1') && call[1]?.method === 'PATCH'
      );
      const requestBody = JSON.parse(updateCall[1].body);

      expect(requestBody).toEqual(expect.objectContaining({
        description: 'Updated description',
        importance: 4
      }));

      // Check success message and redirection
      await waitFor(() => {
        expect(screen.getByText('Relationship updated successfully')).toBeInTheDocument();
      });

      // Should redirect to source entity page after a delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/philosophical-entities/philosopher-1');
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('displays error when entity fetching fails', async () => {
      // Mock fetch error for entities
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Failed to load entities' }),
      });

      render(<RelationshipForm />);

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to load entities')).toBeInTheDocument();
      });
    });

    it('displays error when fetching relationship data fails in edit mode', async () => {
      // Mock fetch error for relationship data
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/philosophical-relationships/')) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Relationship not found' }),
          });
        }
        // Successful response for entities
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockEntities,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
          }),
        });
      });

      render(<RelationshipForm relationshipId="nonexistent-id" />);

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Relationship not found')).toBeInTheDocument();
      });
    });

    it('displays API errors during form submission', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/philosophical-relationships' && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Invalid relationship data' }),
          });
        }
        // Successful response for entities
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockEntities,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
          }),
        });
      });

      render(<RelationshipForm />);

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
      });

      // Fill required fields
      const sourceSelect = screen.getByLabelText('Source Entity');
      const targetSelect = screen.getByLabelText('Target Entity');
      const relationTypesSelect = screen.getByLabelText('Relation Types');

      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });
      fireEvent.change(targetSelect, { target: { value: 'concept-1' } });
      fireEvent.change(relationTypesSelect, {
        target: {
          options: [{ value: 'DEVELOPMENT', selected: true }]
        }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Invalid relationship data')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('provides cancel link to return to entity page', async () => {
      render(<RelationshipForm sourceEntityId="philosopher-1" />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Create New Relationship')).toBeInTheDocument();
      });

      // Check cancel button links to source entity page
      const cancelButton = screen.getByRole('link', { name: 'Cancel' });
      expect(cancelButton).toHaveAttribute('href', '/admin/philosophical-entities/philosopher-1');
    });

    it('provides cancel link to entity list when no source entity', async () => {
      render(<RelationshipForm />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Create New Relationship')).toBeInTheDocument();
      });

      // Check cancel button links to entity list
      const cancelButton = screen.getByRole('link', { name: 'Cancel' });
      expect(cancelButton).toHaveAttribute('href', '/admin/philosophical-entities/');
    });
  });
});
