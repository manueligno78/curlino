import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Vertical Request Layout', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render headers and body sections vertically without tabs', () => {
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

    // Should see Headers section
    expect(screen.getByText('Headers')).toBeInTheDocument();

    // Should see Body section
    expect(screen.getByText('Body')).toBeInTheDocument();

    // Should NOT see any tab buttons
    expect(screen.queryByRole('button', { name: /headers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /body/i })).not.toBeInTheDocument();
  });

  it('should show body section for methods that support body (POST, PUT, PATCH, DELETE)', () => {
    const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];

    methodsWithBody.forEach(method => {
      const request = new Request('1', 'Test Request', 'https://api.example.com/test');
      request.method = method;
      const collection = new Collection('col1', 'Test Collection');

      const { rerender } = render(
        <RequestPanel
          request={request}
          onSendRequest={mockOnSendRequest}
          onSaveToCollection={mockOnSaveToCollection}
          collections={[collection]}
        />
      );

      // Should see body type selector for methods that support body
      expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'TEXT' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'FORM' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'NONE' })).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it('should show query parameters for methods that do not support body (GET, HEAD, OPTIONS)', () => {
    const methodsWithoutBody = ['GET', 'HEAD', 'OPTIONS'];

    methodsWithoutBody.forEach(method => {
      const request = new Request('1', 'Test Request', 'https://api.example.com/test');
      request.method = method;
      const collection = new Collection('col1', 'Test Collection');

      const { rerender } = render(
        <RequestPanel
          request={request}
          onSendRequest={mockOnSendRequest}
          onSaveToCollection={mockOnSaveToCollection}
          collections={[collection]}
        />
      );

      // Should see Query Parameters section
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();

      // Should NOT see Body section at all
      expect(screen.queryByText('Body')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'TEXT' })).not.toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it('should show headers count badge when headers are present', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    };
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Should show badge with count of enabled headers
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge showing 2 headers
  });

  it('should change between query parameters and body section when method changes via dropdown', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET'; // Start with GET (no body support)
    const collection = new Collection('col1', 'Test Collection');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Initially should show Query Parameters for GET
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();

    // Change method to POST via dropdown
    const methodSelect = screen.getByDisplayValue('GET');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    // Now should show Body section and hide Query Parameters for POST
    expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
  });
});
