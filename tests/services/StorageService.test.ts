import { StorageService } from '../../src/services/StorageService';
import { Collection } from '../../src/models/Collection';
import { Environment } from '../../src/models/Environment';
import { Request } from '../../src/models/Request';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('StorageService', () => {
  let storageService: StorageService;

  // Mock console methods to prevent noise in tests
  const originalConsole = { ...console };

  beforeAll(() => {
    console.error = jest.fn();
    console.debug = jest.fn();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue(null);
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  describe('Collections', () => {
    it('should save collections to localStorage', () => {
      const collection = new Collection('test-id', 'Test Collection');
      const collections = [collection];

      storageService.saveCollections(collections);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cUrlino_collections',
        expect.stringContaining('"name":"Test Collection"')
      );
    });

    it('should load collections from localStorage', () => {
      const mockData = JSON.stringify([
        {
          id: 'test-id',
          name: 'Test Collection',
          description: 'Test description',
          requests: [],
        },
      ]);

      mockLocalStorage.getItem.mockReturnValue(mockData);

      const collections = storageService.loadCollections();

      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe('Test Collection');
      expect(collections[0].id).toBe('test-id');
    });

    it('should return empty array when no collections in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const collections = storageService.loadCollections();

      expect(collections).toEqual([]);
    });

    it('should handle corrupted collections data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const collections = storageService.loadCollections();

      expect(collections).toEqual([]);
    });
  });

  describe('Environments', () => {
    it('should save environments to localStorage', () => {
      const environment = new Environment('env-id', 'Test Env');
      const environments = [environment];

      storageService.saveEnvironments(environments);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cUrlino_environments',
        expect.stringContaining('"name":"Test Env"')
      );
    });

    it('should load environments from localStorage', () => {
      const mockData = JSON.stringify([
        {
          id: 'env-id',
          name: 'Test Env',
          variables: [],
        },
      ]);

      mockLocalStorage.getItem.mockReturnValue(mockData);

      const environments = storageService.loadEnvironments();

      expect(environments).toHaveLength(1);
      expect(environments[0].name).toBe('Test Env');
      expect(environments[0].id).toBe('env-id');
    });

    it('should return empty array when no environments in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const environments = storageService.loadEnvironments();

      expect(environments).toEqual([]);
    });
  });

  describe('Active Environment', () => {
    it('should save active environment ID', () => {
      storageService.saveActiveEnvironment('env-123');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cUrlino_active_environment',
        '"env-123"' // Implementation stores as JSON string
      );
    });

    it('should load active environment ID', () => {
      mockLocalStorage.getItem.mockReturnValue('"env-123"'); // JSON string

      const activeEnvId = storageService.loadActiveEnvironmentId();

      expect(activeEnvId).toBe('env-123');
    });

    it('should handle null active environment', () => {
      storageService.saveActiveEnvironment(null);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cUrlino_active_environment');
    });
  });
});
