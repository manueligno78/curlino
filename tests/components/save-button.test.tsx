import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('Save Button Functionality', () => {
  const mockOnSendRequest = jest.fn();
  const mockOnSaveToGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show save button when groups are available and URL is filled', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    await waitFor(() => {
      // Should see the save button (💾 emoji)
      expect(screen.getByTitle('Save to group')).toBeInTheDocument();
    });
  });

  it('should hide save button when no groups are available', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[]} // No groups
      />
    );

    await waitFor(() => {
      // Should NOT see the save button
      expect(screen.queryByTitle('Save to group')).not.toBeInTheDocument();
    });
  });

  it('should hide save button when URL is empty even with groups', async () => {
    const request = new Request('1', 'Test Request', ''); // Empty URL
    const group = new Group('col1', 'Test Group');

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={[group]}
      />
    );

    await waitFor(() => {
      // Should NOT see the save button because URL is empty
      expect(screen.queryByTitle('Save to group')).not.toBeInTheDocument();
    });
  });

  it('should show save button when both URL and groups are available', async () => {
    const request = new Request('1', 'Test Request', 'https://api.example.com/test');
    const groups = [
      new Group('col1', 'Test Group 1'),
      new Group('col2', 'Test Group 2'),
    ];

    render(
      <RequestPanel
        request={request}
        onSendRequest={mockOnSendRequest}
        onSaveToGroup={mockOnSaveToGroup}
        groups={groups}
      />
    );

    await waitFor(() => {
      // Should see the save button
      const saveButton = screen.getByTitle('Save to group');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveTextContent('💾');
    });
  });
});
