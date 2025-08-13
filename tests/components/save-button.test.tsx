import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RequestPanel from '../../src/components/RequestPanel';
import { Request } from '../../src/models/Request';
import { Collection } from '../../src/models/Collection';

// Mock the logger
jest.mock('../../src/utils/BrowserLogger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Save Button Functionality', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show save button when collections are available and URL is filled', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    await waitFor(() => {
      // Should see the save button (💾 emoji)
      expect(screen.getByTitle('Save to collection')).toBeInTheDocument();
    });
  });

  it('should hide save button when no collections are available', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]} // No collections
      />
    );

    await waitFor(() => {
      // Should NOT see the save button
      expect(screen.queryByTitle('Save to collection')).not.toBeInTheDocument();
    });
  });

  it('should hide save button when URL is empty even with collections', async () => {
    const request = new Request('1', 'Test Request', ''); // Empty URL
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    await waitFor(() => {
      // Should NOT see the save button because URL is empty
      expect(screen.queryByTitle('Save to collection')).not.toBeInTheDocument();
    });
  });

  it('should show save button when both URL and collections are available', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    const collections = [
      new Collection('col1', 'Test Collection 1'),
      new Collection('col2', 'Test Collection 2'),
    ];

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={collections}
      />
    );

    await waitFor(() => {
      // Should see the save button
      const saveButton = screen.getByTitle('Save to collection');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveTextContent('💾');
    });
  });
});
