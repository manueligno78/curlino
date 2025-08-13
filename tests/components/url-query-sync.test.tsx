import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('URL and Query Parameters Synchronization', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update URL when query parameters are added', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Add a query parameter
    const keyInput = screen.getByPlaceholderText('Parameter name');
    const valueInput = screen.getByPlaceholderText('Parameter value');
    
    fireEvent.change(keyInput, { target: { value: 'page' } });
    fireEvent.change(valueInput, { target: { value: '1' } });

    // Wait for URL to update
    await waitFor(() => {
      const urlInput = screen.getByDisplayValue(/https:\/\/api\.example\.com\/test\?page=1/);
      expect(urlInput).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should update query parameters when URL is modified', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Modify URL to include query parameters
    const urlInput = screen.getByDisplayValue('https://api.example.com/test');
    fireEvent.change(urlInput, { 
      target: { value: 'https://api.example.com/test?limit=10&sort=desc' } 
    });

    // Expand query parameters section to see the parsed parameters
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Wait for query parameters to be parsed
    await waitFor(() => {
      expect(screen.getByDisplayValue('limit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('sort')).toBeInTheDocument();
      expect(screen.getByDisplayValue('desc')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should remove query parameters from URL when they are disabled', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test?page=1');
    request.method = 'GET';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Find and disable the checkbox for the parameter
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Wait for URL to update (should remove query parameters)
    await waitFor(() => {
      const urlInput = screen.getByDisplayValue('https://api.example.com/test');
      expect(urlInput).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle multiple query parameters correctly', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSaveToCollection}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Add first parameter
    const keyInput = screen.getByPlaceholderText('Parameter name');
    const valueInput = screen.getByPlaceholderText('Parameter value');
    
    fireEvent.change(keyInput, { target: { value: 'page' } });
    fireEvent.change(valueInput, { target: { value: '1' } });

    // Add second parameter
    const addButton = screen.getByText('+ Add Parameter');
    fireEvent.click(addButton);

    const keyInputs = screen.getAllByPlaceholderText('Parameter name');
    const valueInputs = screen.getAllByPlaceholderText('Parameter value');
    
    fireEvent.change(keyInputs[1], { target: { value: 'limit' } });
    fireEvent.change(valueInputs[1], { target: { value: '20' } });

    // Wait for URL to update with both parameters
    await waitFor(() => {
      const urlInput = screen.getByDisplayValue(/https:\/\/api\.example\.com\/test\?.*page=1.*limit=20/);
      expect(urlInput).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should not sync query parameters for POST method', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'POST';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    // Should not see query parameters section for POST
    expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();

    // Modify URL to include query parameters
    const urlInput = screen.getByDisplayValue('https://api.example.com/test');
    fireEvent.change(urlInput, { 
      target: { value: 'https://api.example.com/test?page=1' } 
    });

    // URL should remain as set (no parsing for POST methods)
    await waitFor(() => {
      const updatedUrlInput = screen.getByDisplayValue('https://api.example.com/test?page=1');
      expect(updatedUrlInput).toBeInTheDocument();
    });
  });

  it('should debounce URL parsing to avoid interfering with typing', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    request.method = 'GET';
    const collection = new Collection('col1', 'Test Collection');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[collection]}
      />
    );

    const urlInput = screen.getByDisplayValue('https://api.example.com/test');
    
    // Type incomplete query parameter (should not trigger parsing)
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/test?pag' } });
    
    // Should still be typing, no parameters parsed yet
    expect(screen.queryByDisplayValue('pag')).not.toBeInTheDocument();
    
    // Complete the parameter
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/test?page=1' } });
    
    // Expand query parameters section
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);

    // Wait for debounced parsing (500ms + buffer)
    await waitFor(() => {
      expect(screen.getByDisplayValue('page')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});