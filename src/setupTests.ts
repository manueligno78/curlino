import '@testing-library/jest-dom';

// Mock electron APIs
const mockElectron = {
  ipcRenderer: {
    send: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
};

// Mock window.electronAPI if needed
Object.defineProperty(window, 'electronAPI', {
  value: mockElectron,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
