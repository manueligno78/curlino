import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RequestPanel from '../../src/components/RequestPanel';
import { Request } from '../../src/models/Request';

// Mock the logger
jest.mock('../../src/utils/BrowserLogger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('JSON Formatting Feature', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show format button only when JSON body type is selected', () => {
    const request = new Request('1', 'Test', 'https://example.com');
    request.method = 'POST'; // Use POST method so body section is visible

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Body section should be visible (no tabs anymore, just sections)
    expect(screen.getByText('Body')).toBeInTheDocument();

    // Initially JSON is selected by default, so format button should be visible
    expect(screen.getByText('✨ Format')).toBeInTheDocument();

    // Switch to none type to hide format button
    const noneButton = screen.getByRole('button', { name: 'NONE' });
    fireEvent.click(noneButton);

    // Format button should now be hidden
    expect(screen.queryByText('✨ Format')).not.toBeInTheDocument();

    // Select JSON type again
    const jsonButton = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonButton);

    // Format button should be visible again
    expect(screen.getByText('✨ Format')).toBeInTheDocument();

    // Switch to text type
    const textButton = screen.getByRole('button', { name: 'TEXT' });
    fireEvent.click(textButton);

    // Format button should be hidden again
    expect(screen.queryByText('✨ Format')).not.toBeInTheDocument();
  });

  it('should format valid JSON correctly', async () => {
    const request = new Request('1', 'Test', 'https://example.com');
    request.method = 'POST'; // Use POST method so body section is visible
    request.body = '{"name":"test","age":25,"active":true}';

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Body section should be visible (no tabs anymore, just sections)
    expect(screen.getByText('Body')).toBeInTheDocument();

    // JSON should be selected by default, make sure it's selected
    const jsonButton = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonButton);

    // Check initial unformatted JSON
    const textarea = screen.getByDisplayValue('{"name":"test","age":25,"active":true}');
    expect(textarea).toBeInTheDocument();

    // Click format button
    const formatButton = screen.getByText('✨ Format');
    fireEvent.click(formatButton);

    // The JSON should be formatted - let's check that the textarea value has changed
    // Since React Testing Library re-queries the DOM, we need to get the textarea again
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the textarea now contains formatted JSON
    const formattedTextarea = screen.getByRole('textbox', {
      name: /request body content/i,
    }) as HTMLTextAreaElement;
    expect(formattedTextarea).toHaveValue(
      '{\n  "name": "test",\n  "age": 25,\n  "active": true\n}'
    );
  });

  it('should handle invalid JSON gracefully', () => {
    const request = new Request('1', 'Test', 'https://example.com');
    request.method = 'POST'; // Use POST method so body section is visible
    request.body = '{"name":"test",invalid}';

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Body section should be visible (no tabs anymore, just sections)
    expect(screen.getByText('Body')).toBeInTheDocument();

    // JSON should be selected by default, make sure it's selected
    const jsonButton = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonButton);

    // Click format button
    const formatButton = screen.getByText('✨ Format');
    fireEvent.click(formatButton);

    // Should show error message
    expect(screen.getByText('Invalid JSON format - cannot format')).toBeInTheDocument();

    // Original text should remain unchanged
    expect(screen.getByDisplayValue('{"name":"test",invalid}')).toBeInTheDocument();
  });

  it('should handle empty body gracefully', () => {
    const request = new Request('1', 'Test', 'https://example.com');
    request.method = 'POST'; // Use POST method so body section is visible
    request.body = '';

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Body section should be visible (no tabs anymore, just sections)
    expect(screen.getByText('Body')).toBeInTheDocument();

    // JSON should be selected by default, make sure it's selected
    const jsonButton = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonButton);

    // Click format button
    const formatButton = screen.getByText('✨ Format');
    fireEvent.click(formatButton);

    // Should show error message
    expect(screen.getByText('No JSON content to format')).toBeInTheDocument();
  });

  it('should format complex nested JSON', async () => {
    const request = new Request('1', 'Test', 'https://example.com');
    request.method = 'POST'; // Use POST method so body section is visible
    const complexJson = '{"user":{"name":"John","details":{"age":30,"tags":["admin","user"]}}}';
    request.body = complexJson;

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToCollection={mockOnSaveToCollection}
        collections={[]}
      />
    );

    // Body section should be visible (no tabs anymore, just sections)
    expect(screen.getByText('Body')).toBeInTheDocument();

    // JSON should be selected by default, make sure it's selected
    const jsonButton = screen.getByRole('button', { name: 'JSON' });
    fireEvent.click(jsonButton);

    // Check initial unformatted JSON
    const textarea = screen.getByDisplayValue(complexJson);
    expect(textarea).toBeInTheDocument();

    // Click format button
    const formatButton = screen.getByText('✨ Format');
    fireEvent.click(formatButton);

    // Wait for the state update to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the value changed from unformatted to formatted
    // The exact formatting doesn't matter as much as ensuring it was processed
    const formattedTextarea = screen.getByRole('textbox', {
      name: /request body content/i,
    }) as HTMLTextAreaElement;
    expect(formattedTextarea.value).not.toBe(complexJson); // Should be different from original
    expect(formattedTextarea.value).toContain('{\n  "user"'); // Should have proper indentation
  });
});
