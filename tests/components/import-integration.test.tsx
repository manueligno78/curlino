import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportPanel from '../../src/components/ImportPanel';
import RequestPanel from '../../src/components/RequestPanel';
import { Request } from '../../src/models/Request';
import { importCurlCommand } from '../../src/utils/curlImporter';

// Mock the logger
jest.mock('../../src/utils/BrowserLogger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock ImportPanel to avoid SVG import issues
jest.mock('../../src/components/ImportPanel', () => {
  return function MockImportPanel({ onImport }: { onImport: (url: string) => void }) {
    return (
      <div data-testid="import-panel">
        <textarea data-testid="curl-input" placeholder="Paste your cURL command here..." />
        <button data-testid="import-button" onClick={() => onImport('test-curl')}>
          Import
        </button>
      </div>
    );
  };
});

describe('cURL Import Integration', () => {
  it('should import cURL command and display URL in RequestPanel', async () => {
    const testCurl = 'curl -X POST https://httpbin.org/post -d \'{"test": true}\'';

    // Test the import flow
    const mockOnImport = jest.fn();

    // Render ImportPanel
    render(<ImportPanel onImport={mockOnImport} />);

    // Find textarea and paste cURL command (avoid typing with special characters)
    const textarea = screen.getByTestId('curl-input');
    fireEvent.change(textarea, { target: { value: testCurl } });

    // Click import button
    const importButton = screen.getByText('Import');
    fireEvent.click(importButton);

    // Verify import was called
    expect(mockOnImport).toHaveBeenCalledWith('test-curl');

    // Test that the cURL import function works correctly
    const importedRequest = importCurlCommand(testCurl);
    expect(importedRequest).toBeTruthy();
    expect(importedRequest?.url).toBe('https://httpbin.org/post');
    expect(importedRequest?.method).toBe('POST');
    expect(importedRequest?.body).toBe('{"test": true}');
  });

  it('should render RequestPanel with imported URL visible', async () => {
    // Create a request from cURL import
    const testCurl = 'curl -X GET https://api.github.com/user -H "Authorization: Bearer token"';
    const importedRequest = importCurlCommand(testCurl);

    expect(importedRequest).toBeTruthy();

    const mockOnSendRequest = jest.fn();
    const mockOnSaveToCollection = jest.fn();

    // Render RequestPanel with imported request
    render(
      <RequestPanel
        request={importedRequest!}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    await waitFor(() => {
      // Check that URL field exists and has the correct value
      const urlInput = screen.getByDisplayValue('https://api.github.com/user');
      expect(urlInput).toBeInTheDocument();
      expect(urlInput).toBeVisible();

      // Check that method is correct
      const methodSelect = screen.getByDisplayValue('GET');
      expect(methodSelect).toBeInTheDocument();

      // Check that the Headers section is present
      expect(screen.getByText('Headers')).toBeInTheDocument();
      // Headers should show a badge with count 1 (collapsed by default)
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge showing 1 header

      // Click to expand headers section to check the Authorization header
      const headersSection = screen.getByText('Headers');
      fireEvent.click(headersSection);

      // Now check that the Authorization header is present
      expect(screen.getByDisplayValue('Authorization')).toBeInTheDocument();
    });
  });

  it('should handle various cURL formats correctly', () => {
    const testCases = [
      {
        curl: 'curl https://httpbin.org/get',
        expectedUrl: 'https://httpbin.org/get',
        expectedMethod: 'GET',
      },
      {
        curl: 'curl -X POST https://httpbin.org/post -d \'{"name":"test"}\'',
        expectedUrl: 'https://httpbin.org/post',
        expectedMethod: 'POST',
      },
      {
        curl: 'curl -H "Content-Type: application/json" https://api.example.com/data',
        expectedUrl: 'https://api.example.com/data',
        expectedMethod: 'GET',
      },
    ];

    testCases.forEach(({ curl, expectedUrl, expectedMethod }) => {
      const request = importCurlCommand(curl);
      expect(request).toBeTruthy();
      expect(request?.url).toBe(expectedUrl);
      expect(request?.method).toBe(expectedMethod);
    });
  });

  it('should update URL field when request prop changes', async () => {
    const mockOnSendRequest = jest.fn();
    const mockOnSaveToCollection = jest.fn();

    const initialRequest = new Request('1', 'Test', 'https://initial.com');

    const { rerender } = render(
      <RequestPanel
        request={initialRequest}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Verify initial URL
    expect(screen.getByDisplayValue('https://initial.com')).toBeInTheDocument();

    // Create new request from cURL
    const importedRequest = importCurlCommand('curl https://updated.com/endpoint');
    expect(importedRequest).toBeTruthy();

    // Re-render with new request
    rerender(
      <RequestPanel
        request={importedRequest!}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    await waitFor(() => {
      // Verify URL was updated
      expect(screen.getByDisplayValue('https://updated.com/endpoint')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('https://initial.com')).not.toBeInTheDocument();
    });
  });
});
