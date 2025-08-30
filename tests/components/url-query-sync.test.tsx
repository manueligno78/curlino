import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('URL and Query Parameters Synchronization', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update URL when query parameters are added', async () => {
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

  it.skip('should update query parameters when URL is modified', async () => {
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

    // Expand query parameters section first
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);
    
    // Wait a moment for the section to expand
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Parameter name')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Modify URL to include query parameters
    const urlInput = screen.getByDisplayValue('https://api.example.com/test');
    act(() => {
      fireEvent.change(urlInput, { 
        target: { value: 'https://api.example.com/test?limit=10&sort=desc' } 
      });
    });

    // Wait for debounce timer (500ms) and parsing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
    });
    
    // Now check for the parsed parameters
    await waitFor(() => {
      const limitKeys = screen.getAllByDisplayValue('limit');
      const limitValues = screen.getAllByDisplayValue('10');
      expect(limitKeys.length).toBeGreaterThan(0);
      expect(limitValues.length).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it('should remove query parameters from URL when they are disabled', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test?page=1');
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
    const group = new Group('col1', 'Test Group');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSaveToGroup}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
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
    const group = new Group('col1', 'Test Group');
    
    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
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

  it.skip('should debounce URL parsing to avoid interfering with typing', async () => {
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

    // Expand query parameters section first
    const queryParamsSection = screen.getByText('Query Parameters');
    fireEvent.click(queryParamsSection);
    
    // Wait for section to expand
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Parameter name')).toBeInTheDocument();
    }, { timeout: 1000 });

    const urlInput = screen.getByDisplayValue('https://api.example.com/test');
    
    // Type incomplete query parameter (should not trigger parsing)
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/test?pag' } });
    
    // Should still be typing, no parameters parsed yet
    expect(screen.queryByDisplayValue('pag')).not.toBeInTheDocument();
    
    // Complete the parameter
    act(() => {
      fireEvent.change(urlInput, { target: { value: 'https://api.example.com/test?page=1' } });
    });

    // Wait for debounce timer (500ms) and parsing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
    });
    
    // Now check for the parsed parameters
    await waitFor(() => {
      const pageKeys = screen.getAllByDisplayValue('page');
      const pageValues = screen.getAllByDisplayValue('1');
      expect(pageKeys.length).toBeGreaterThan(0);
      expect(pageValues.length).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });
});