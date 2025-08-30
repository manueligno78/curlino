import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RequestPanel from '../../src/components/RequestPanel';
import { Request } from '../../src/models/Request';
import { Group } from '../../src/models/Group';

// Mock the logger
jest.mock('../../src/utils/BrowserLogger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Query Parameters Feature', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show query parameters section for GET requests', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    // Should see Query Parameters section for GET request
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();

    // Should NOT see Body section for GET request
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('should not show query parameters section for POST requests', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'POST';
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    // Should NOT see Query Parameters section for POST request
    expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();

    // Should see Body section with body type selector
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
  });

  it('should allow adding and managing query parameters', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    // Click to expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Should see the add parameter button
    expect(screen.getByText('+ Add Parameter')).toBeInTheDocument();

    // Should see placeholder inputs
    expect(screen.getByPlaceholderText('Parameter name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Parameter value')).toBeInTheDocument();
  });

  it('should parse existing query parameters from URL', () => {
    const request = new Request(
      '1',
      'Test Request',
      'https://api.example.com/test?page=1&limit=10'
    );
    request.method = 'GET';
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    // Should show badge with count of query parameters
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge showing 2 parameters

    // Click to expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Should show the parsed parameters
    expect(screen.getByDisplayValue('page')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('limit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('should switch between query params and body sections based on method', () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET'; // Start with GET
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    // Initially should show Query Parameters for GET
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();

    // Change method to POST
    const methodSelect = screen.getByDisplayValue('GET');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    // Now should hide Query Parameters and show body editor
    expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
  });

  it('should show correct methods that support query parameters', () => {
    const methodsWithQueryParams = ['GET', 'HEAD', 'OPTIONS'];
    const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];

    methodsWithQueryParams.forEach(method => {
      const request = new Request('1', 'Test Request', 'https://api.example.com/test');
      request.method = method;
      const group = new Group('col1', 'Test Group');

      const { rerender } = render(
        <RequestPanel
          request={request}
          onSendRequest={mockOnSendRequest}
          onSaveToGroup={mockOnSaveToGroup}
          groups={[group]}
        />
      );

      // Should show Query Parameters section for methods that don't support body
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();
      expect(screen.queryByText('Body')).not.toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });

    methodsWithBody.forEach(method => {
      const request = new Request('1', 'Test Request', 'https://api.example.com/test');
      request.method = method;
      const group = new Group('col1', 'Test Group');

      const { rerender } = render(
        <RequestPanel
          request={request}
          onSendRequest={mockOnSendRequest}
          onSaveToGroup={mockOnSaveToGroup}
          groups={[group]}
        />
      );

      // Should NOT show Query Parameters section for methods that support body
      expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });
});
