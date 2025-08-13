import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/renderer/App';

// Mock services to prevent actual storage/API calls during tests
jest.mock('../../src/services/StorageService', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    loadCollections: jest.fn(() => []),
    loadEnvironments: jest.fn(() => []),
    loadActiveEnvironmentId: jest.fn(() => null),
    saveCollections: jest.fn(),
    saveEnvironments: jest.fn(),
    saveActiveEnvironment: jest.fn(),
  })),
}));

jest.mock('../../src/services/SettingsService', () => ({
  SettingsService: jest.fn().mockImplementation(() => ({
    getSettings: jest.fn(() => ({
      theme: { isDark: false },
    })),
    applyCurrentTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
}));

jest.mock('../../src/services/ApiService', () => ({
  ApiService: jest.fn().mockImplementation(() => ({
    setActiveEnvironment: jest.fn(),
    sendRequest: jest.fn(),
  })),
}));

// Mock components to test layout classes
jest.mock('../../src/components/SettingsModal', () => ({
  SettingsModal: () => <div data-testid="settings-modal">Settings Modal</div>,
}));

jest.mock('../../src/components/Header', () => {
  return function Header({ onActivateBuilder }: { onActivateBuilder: () => void }) {
    return (
      <header>
        <h1>Curlino</h1>
        <nav>
          <button onClick={onActivateBuilder} className="nav-button">
            Builder
          </button>
        </nav>
      </header>
    );
  };
});

jest.mock('../../src/components/Sidebar', () => {
  return function Sidebar() {
    return <aside data-testid="sidebar">Sidebar</aside>;
  };
});

jest.mock('../../src/components/RequestPanel', () => {
  return function RequestPanel() {
    return <div data-testid="request-panel">Request Panel</div>;
  };
});

jest.mock('../../src/components/ResponsePanel', () => {
  return function ResponsePanel() {
    return <div data-testid="response-panel">Response Panel</div>;
  };
});

jest.mock('../../src/components/TabSystem', () => {
  return function TabSystem() {
    return <div data-testid="tab-system">Tab System</div>;
  };
});

jest.mock('../../src/components/HistoryPanel', () => {
  return function HistoryPanel() {
    return <div>History Panel</div>;
  };
});

jest.mock('../../src/components/ImportPanel', () => {
  return function ImportPanel() {
    return <div>Import Panel</div>;
  };
});

// Mock CSS imports
jest.mock('../App-new.css', () => ({}));
jest.mock('../../styles/components.css', () => ({}));
jest.mock('../../styles/RequestPanel.css', () => ({}));
jest.mock('../../styles/ResponsePanel.css', () => ({}));
jest.mock('../../styles/SettingsModal.css', () => ({}));

describe('Horizontal Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use horizontal layout classes for builder panels', async () => {
    const { container } = render(<App />);

    // Wait for app to initialize and click builder
    await waitFor(() => {
      const builderButton = screen.getByText('Builder');
      builderButton.click();
    });

    await waitFor(() => {
      // Check that the horizontal panels container exists
      const horizontalPanels = container.querySelector('.builder-vertical-panels');
      expect(horizontalPanels).toBeInTheDocument();

      // Check that request and response panels exist
      const requestPanel = container.querySelector('.builder-request-panel');
      const responsePanel = container.querySelector('.builder-response-panel');

      expect(requestPanel).toBeInTheDocument();
      expect(responsePanel).toBeInTheDocument();
    });
  });

  it('should have horizontal layout CSS classes structure', async () => {
    const { container } = render(<App />);

    // Switch to builder view
    await waitFor(() => {
      const builderButton = screen.getByText('Builder');
      builderButton.click();
    });

    await waitFor(() => {
      // Check the overall layout structure
      const contentArea = container.querySelector('.content-area');
      expect(contentArea).toBeInTheDocument();

      const horizontalPanels = container.querySelector('.builder-vertical-panels');
      expect(horizontalPanels).toBeInTheDocument();

      // Verify the panels are inside the horizontal container
      const requestPanel = horizontalPanels?.querySelector('.builder-request-panel');
      const responsePanel = horizontalPanels?.querySelector('.builder-response-panel');

      expect(requestPanel).toBeInTheDocument();
      expect(responsePanel).toBeInTheDocument();
    });
  });

  it('should have resize handle for horizontal layout', async () => {
    const { container } = render(<App />);

    // Switch to builder view
    await waitFor(() => {
      const builderButton = screen.getByText('Builder');
      builderButton.click();
    });

    await waitFor(() => {
      // Check for the resize handle
      const resizeHandle = container.querySelector('.panel-resize-handle');
      expect(resizeHandle).toBeInTheDocument();

      // Verify it's inside the request panel (for horizontal resizing)
      const requestPanel = container.querySelector('.builder-request-panel');
      const handleInRequestPanel = requestPanel?.querySelector('.panel-resize-handle');
      expect(handleInRequestPanel).toBeInTheDocument();
    });
  });
});
