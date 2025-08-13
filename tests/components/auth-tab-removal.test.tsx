import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('Auth Tab Removal', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render Auth section', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'POST'; // Use POST method to see Body section
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Should see Headers and Body sections (as titles, not tabs)
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();

    // Should NOT see Auth content
    expect(screen.queryByText(/authentication/i)).not.toBeInTheDocument();
  });

  it('should only have two sections (Headers and Body)', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'POST'; // Method that supports body
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Should have Headers and Body sections (as headings)
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();

    // Should NOT have any tab buttons for these sections
    expect(screen.queryByRole('button', { name: /headers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /body/i })).not.toBeInTheDocument();
  });

  it('should not render auth section content', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET'; // Use GET method to see Query Parameters instead of Body
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Should not find auth-related content
    expect(screen.queryByText(/authentication/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auth configuration coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/🔐/)).not.toBeInTheDocument();

    // Should see Query Parameters section for GET method
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
  });
});
