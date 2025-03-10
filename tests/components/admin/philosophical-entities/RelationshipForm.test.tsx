// tests/components/admin/philosophical-entities/RelationshipForm.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RelationshipForm, {
  validateRequired,
  validateRelationshipForm,
  Entity,
  Relationship
} from '@/components/admin/philosophical-entities/RelationshipForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Use fake timers for setTimeout control
jest.useFakeTimers();

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = { ...originalLocation, href: '' };

describe('RelationshipForm Component', () => {
  const mockPush = jest.fn();

  // Sample entities for dropdown options
  const mockEntities: Entity[] = [
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
  const mockRelationship: Relationship = {
    id: 'relation-1',
    sourceEntityId: 'philosopher-1',
    targetEntityId: 'concept-1',
    relationTypes: ['DEVELOPMENT'],
    description: 'Kant developed the Categorical Imperative',
    importance: 5,
  };

  // Mock implementation functions
  const mockFetchEntities = jest.fn().mockResolvedValue(mockEntities);
  const mockFetchRelationship = jest.fn().mockResolvedValue(mockRelationship);
  const mockCreateRelationship = jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-relation-id', ...data }));
  const mockUpdateRelationship = jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...mockRelationship, ...data }));

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Reset window.location.href between tests
    window.location.href = '';
  });

  afterAll(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('Pure Functions', () => {
    describe('validateRequired', () => {
      it('should return false for empty values', () => {
        expect(validateRequired('')).toBe(false);
        expect(validateRequired(null)).toBe(false);
        expect(validateRequired(undefined)).toBe(false);
      });

      it('should return true for non-empty values', () => {
        expect(validateRequired('test')).toBe(true);
        expect(validateRequired(0)).toBe(true);
        expect(validateRequired(false)).toBe(true);
        expect(validateRequired([])).toBe(true);
      });
    });

    describe('validateRelationshipForm', () => {
      it('should validate required fields', () => {
        const emptyData = {};
        const result = validateRelationshipForm(emptyData);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Source entity is required');
        expect(result.errors).toContain('Target entity is required');
        expect(result.errors).toContain('Please select at least one relation type');
      });

      it('should validate source and target must be different', () => {
        const sameEntityData = {
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-1',
          relationTypes: ['DEVELOPMENT']
        };
        const result = validateRelationshipForm(sameEntityData);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Source and target entities must be different');
      });

      it('should validate relation types are required', () => {
        const noRelationTypes = {
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          relationTypes: []
        };
        const result = validateRelationshipForm(noRelationTypes);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Please select at least one relation type');
      });

      it('should return valid for complete data', () => {
        const validData = {
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          relationTypes: ['DEVELOPMENT']
        };
        const result = validateRelationshipForm(validData);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Rendering', () => {
    it('renders create form correctly', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
        />
      );

      // Initially show loading state for entities
      expect(screen.getByRole('status', { name: 'Loading entities' })).toBeInTheDocument();

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Check for required fields
      expect(screen.getByLabelText('Source Entity')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Entity')).toBeInTheDocument();
      expect(screen.getByLabelText('Relation Types')).toBeInTheDocument();

      // Check submit button text
      expect(screen.getByRole('button', { name: 'Create Relationship' })).toBeInTheDocument();
    });

    it('renders with pre-selected source entity when sourceEntityId is provided', async () => {
      render(
        <RelationshipForm
          sourceEntityId="philosopher-1"
          fetchEntities={mockFetchEntities}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Check source entity is selected and disabled
      const sourceSelect = screen.getByTestId('source-entity-select') as HTMLSelectElement;
      expect(sourceSelect.value).toBe('philosopher-1');
      expect(sourceSelect).toBeDisabled();

      // Target entity should be enabled
      const targetSelect = screen.getByTestId('target-entity-select') as HTMLSelectElement;
      expect(targetSelect).not.toBeDisabled();
    });

    it('renders edit form correctly when relationshipId is provided', async () => {
      render(
        <RelationshipForm
          relationshipId="relation-1"
          fetchEntities={mockFetchEntities}
          fetchRelationship={mockFetchRelationship}
        />
      );

      // Wait for relationship data to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Edit Relationship Form' })).toBeInTheDocument();
      });

      // Check form is populated with relationship data
      const sourceSelect = screen.getByTestId('source-entity-select') as HTMLSelectElement;
      const targetSelect = screen.getByTestId('target-entity-select') as HTMLSelectElement;
      const descriptionField = screen.getByTestId('description-input') as HTMLTextAreaElement;

      expect(sourceSelect.value).toBe('philosopher-1');
      expect(targetSelect.value).toBe('concept-1');
      expect(descriptionField.value).toBe('Kant developed the Categorical Imperative');

      // Check both entity selects are disabled in edit mode
      expect(sourceSelect).toBeDisabled();
      expect(targetSelect).toBeDisabled();

      // Check submit button text for edit mode
      expect(screen.getByRole('button', { name: 'Update Relationship' })).toBeInTheDocument();

      // Verify mock functions were called
      expect(mockFetchEntities).toHaveBeenCalled();
      expect(mockFetchRelationship).toHaveBeenCalledWith('relation-1');
    });
  });

  describe('Entity Selection', () => {
    it('populates entity dropdowns with fetched data', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Check that dropdown options are populated
      // First option is the placeholder
      expect(screen.getByText('Select Source Entity')).toBeInTheDocument();

      // Get the source entity select element
      const sourceSelect = screen.getByTestId('source-entity-select');

      // Check that the options are present in the source entity dropdown
      const sourceOptions = Array.from(sourceSelect.querySelectorAll('option'));
      expect(sourceOptions.some(option => option.textContent === 'Immanuel Kant (Philosopher)')).toBe(true);
      expect(sourceOptions.some(option => option.textContent === 'Categorical Imperative (PhilosophicalConcept)')).toBe(true);
      expect(sourceOptions.some(option => option.textContent === 'Ethics (Branch)')).toBe(true);
    });

    it('filters target entity options to exclude selected source entity', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Select a source entity
      const sourceSelect = screen.getByTestId('source-entity-select');
      fireEvent.change(sourceSelect, { target: { value: 'philosopher-1' } });

      // Check target entity options
      const targetSelect = screen.getByTestId('target-entity-select') as HTMLSelectElement;

      // Get all the option elements
      const options = Array.from(targetSelect.options).map(opt => opt.value);

      // Should not contain the selected source entity
      expect(options).not.toContain('philosopher-1');

      // Should contain the other entities
      expect(options).toContain('concept-1');
      expect(options).toContain('branch-1');

      // Verify by option text content as well
      const targetOptions = Array.from(targetSelect.querySelectorAll('option'));
      expect(targetOptions.some(option => option.textContent === 'Immanuel Kant (Philosopher)')).toBe(false);
      expect(targetOptions.some(option => option.textContent === 'Categorical Imperative (PhilosophicalConcept)')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors when submitting with empty fields', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
          createRelationship={mockCreateRelationship}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Check for validation errors - verify validation errors appear in the document
      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      });

      // Now check for the validation message content in the document
      expect(screen.getAllByText(/Source entity is required/i)).toHaveLength(2);
      expect(screen.getAllByText(/Target entity is required/i)).toHaveLength(2);
      expect(screen.getAllByText(/Please select at least one relation type/i)).toHaveLength(2);


      // Verify create function was not called
      expect(mockCreateRelationship).not.toHaveBeenCalled();
    });

    it('validates that at least one relation type must be selected', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
          createRelationship={mockCreateRelationship}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Fill source and target but not relation types
      fireEvent.change(screen.getByTestId('source-entity-select'), { target: { value: 'philosopher-1' } });
      fireEvent.change(screen.getByTestId('target-entity-select'), { target: { value: 'concept-1' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Check for validation errors
      await waitFor(() => {
        const validationErrors = screen.getByTestId('validation-errors');
        expect(validationErrors.textContent).toMatch(/Please select at least one relation type/i);
      });

      // Verify create function was not called
      expect(mockCreateRelationship).not.toHaveBeenCalled();
    });

    it('clears validation errors when form fields are changed', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
          createRelationship={mockCreateRelationship}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Submit without filling required fields to trigger errors
      fireEvent.click(screen.getByRole('button', { name: 'Create Relationship' }));

      // Check for validation error messages
      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
        expect(screen.getAllByText(/Source entity is required/i)).toHaveLength(2);
      });

      // Now fill in the source field
      fireEvent.change(screen.getByTestId('source-entity-select'), { target: { value: 'philosopher-1' } });

      // The validation errors should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('validation-errors')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('successfully submits new relationship data', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
          createRelationship={mockCreateRelationship}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Fill all required fields
      fireEvent.change(screen.getByTestId('source-entity-select'), { target: { value: 'philosopher-1' } });
      fireEvent.change(screen.getByTestId('target-entity-select'), { target: { value: 'concept-1' } });

      // Select relation type - THIS IS THE FIX
      const relationTypesSelect = screen.getByTestId('relation-types-select');

      // Directly modify the DOM element's value and selected properties
      const developmentOption = Array.from(relationTypesSelect.options).find(
        option => option.value === 'DEVELOPMENT'
      );

      if (developmentOption) {
        developmentOption.selected = true;
        fireEvent.change(relationTypesSelect);
      }

      // Fill description
      fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'Test description' } });

      // Submit form
      fireEvent.click(screen.getByTestId('submit-button'));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Relationship created successfully')).toBeInTheDocument();
      });

      // Verify create function was called with correct data
      expect(mockCreateRelationship).toHaveBeenCalledWith({
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT'],
        description: 'Test description',
        importance: 3 // Default value
      });

      // Fast-forward timers to trigger the redirect timeout
      jest.advanceTimersByTime(2000);

      // Now verify the redirect using window.location.href
      expect(window.location.href).toBe('/admin/philosophical-entities/philosopher-1');
    });

    it('successfully updates an existing relationship', async () => {
      render(
        <RelationshipForm
          relationshipId="relation-1"
          fetchEntities={mockFetchEntities}
          fetchRelationship={mockFetchRelationship}
          updateRelationship={mockUpdateRelationship}
        />
      );

      // Wait for relationship data to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Edit Relationship Form' })).toBeInTheDocument();
      });

      // Ensure relation types are properly selected
      const relationTypesSelect = screen.getByTestId('relation-types-select');

      // IMPORTANT: Verify or ensure the relation type is selected
      const developmentOption = Array.from(relationTypesSelect.options).find(
        option => option.value === 'DEVELOPMENT'
      );

      if (developmentOption && !developmentOption.selected) {
        developmentOption.selected = true;
        fireEvent.change(relationTypesSelect);
      }

      // Update description field
      fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'Updated description' } });

      // Update importance slider
      fireEvent.change(screen.getByTestId('importance-slider'), { target: { value: '4' } });

      // Submit form
      fireEvent.click(screen.getByTestId('submit-button'));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Relationship updated successfully')).toBeInTheDocument();
      });

      // Verify update function was called with correct data
      expect(mockUpdateRelationship).toHaveBeenCalledWith('relation-1', {
        sourceEntityId: 'philosopher-1',
        targetEntityId: 'concept-1',
        relationTypes: ['DEVELOPMENT'],
        description: 'Updated description',
        importance: 4,
        id: 'relation-1'
      });

      // Fast-forward timers to trigger the redirect timeout
      jest.advanceTimersByTime(2000);

      // Now verify the redirect using window.location.href
      expect(window.location.href).toBe('/admin/philosophical-entities/philosopher-1');
    });
  });

  describe('Error Handling', () => {
    it('displays error when entity fetching fails', async () => {
      const mockFetchError = jest.fn().mockRejectedValue(new Error('Failed to load entities'));

      render(
        <RelationshipForm
          fetchEntities={mockFetchError}
        />
      );

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to load entities')).toBeInTheDocument();
      });
    });

    it('displays error when fetching relationship data fails in edit mode', async () => {
      const mockFetchRelationshipError = jest.fn().mockRejectedValue(new Error('Relationship not found'));

      render(
        <RelationshipForm
          relationshipId="nonexistent-id"
          fetchEntities={mockFetchEntities}
          fetchRelationship={mockFetchRelationshipError}
        />
      );

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Relationship not found')).toBeInTheDocument();
      });
    });

    it('displays API errors during form submission', async () => {
      const mockCreateError = jest.fn().mockRejectedValue(new Error('Invalid relationship data'));

      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
          createRelationship={mockCreateError}
        />
      );

      // Wait for entities to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Fill required fields
      fireEvent.change(screen.getByTestId('source-entity-select'), { target: { value: 'philosopher-1' } });
      fireEvent.change(screen.getByTestId('target-entity-select'), { target: { value: 'concept-1' } });

      // Select relation type - using the direct DOM approach
      const relationTypesSelect = screen.getByTestId('relation-types-select');
      const developmentOption = Array.from(relationTypesSelect.options).find(
        option => option.value === 'DEVELOPMENT'
      );

      if (developmentOption) {
        developmentOption.selected = true;
        fireEvent.change(relationTypesSelect);
      }

      // Submit form
      fireEvent.click(screen.getByTestId('submit-button'));

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
      render(
        <RelationshipForm
          sourceEntityId="philosopher-1"
          fetchEntities={mockFetchEntities}
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Check cancel button links to source entity page
      const cancelButton = screen.getByRole('link', { name: 'Cancel and return to entity page' });
      expect(cancelButton).toHaveAttribute('href', '/admin/philosophical-entities/philosopher-1');
    });

    it('provides cancel link to entity list when no source entity', async () => {
      render(
        <RelationshipForm
          fetchEntities={mockFetchEntities}
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('form', { name: 'Create Relationship Form' })).toBeInTheDocument();
      });

      // Check cancel button links to entity list
      const cancelButton = screen.getByRole('link', { name: 'Cancel and return to entity page' });
      expect(cancelButton).toHaveAttribute('href', '/admin/philosophical-entities');
    });
  });
});
