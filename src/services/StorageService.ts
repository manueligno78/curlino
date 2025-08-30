// filepath: /Users/manuel/curlino/src/services/StorageService.ts
import { Group, GroupInterface } from '../models/Group';
import { Environment, EnvironmentInterface } from '../models/Environment';
import { Request, RequestInterface } from '../models/Request';
import { logger } from '../utils/BrowserLogger';

// Definizione del tipo per il localStorage in ambito Electron
declare global {
  interface Window {
    electronStorage?: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
  }
}

export class StorageService {
  private readonly GROUPS_KEY = 'cUrlino_groups';
  private readonly ENVIRONMENTS_KEY = 'cUrlino_environments';
  private readonly ACTIVE_ENV_KEY = 'cUrlino_active_environment';
  private readonly RECENT_REQUESTS_KEY = 'cUrlino_recent_requests';

  constructor() {
    logger.debug('StorageService initialization', {
      component: 'StorageService',
      action: 'initialize',
    });
    this.migrateOldData();
  }

  // Metodi generici per storage
  getItem<T>(key: string): T | null {
    try {
      // Cerca di usare electronStorage se disponibile, altrimenti usa localStorage
      let storage;
      if (typeof window !== 'undefined' && window.electronStorage) {
        // Log solo in development
        logger.debug('Using electron storage backend', {
          component: 'StorageService',
          storageType: 'electron',
        });
        storage = window.electronStorage;
      } else {
        logger.debug('Using standard localStorage backend', {
          component: 'StorageService',
          storageType: 'localStorage',
        });
        storage = localStorage;
      }

      const item = storage.getItem(key);
      if (!item) return null;

      return JSON.parse(item) as T;
    } catch (e) {
      logger.storageOperation('getItem', key, false, e as Error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      let storage;
      if (typeof window !== 'undefined' && window.electronStorage) {
        storage = window.electronStorage;
      } else {
        storage = localStorage;
      }
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logger.storageOperation('setItem', key, false, e as Error);
    }
  }

  removeItem(key: string): void {
    try {
      let storage;
      if (typeof window !== 'undefined' && window.electronStorage) {
        storage = window.electronStorage;
      } else {
        storage = localStorage;
      }
      logger.debug('Removing storage key', {
        component: 'StorageService',
        action: 'removeItem',
        key,
      });
      storage.removeItem(key);
    } catch (e) {
      logger.storageOperation('removeItem', key, false, e as Error);
    }
  }

  // Groups
  saveGroups(groups: Group[]): void {
    const groupsData = groups.map(group => group.toJSON());
    logger.debug('Saving groups', {
      component: 'StorageService',
      action: 'saveGroups',
      count: groupsData.length,
    });
    this.setItem(this.GROUPS_KEY, groupsData);
  }

  loadGroups(): Group[] {
    const groupsData = this.getItem<GroupInterface[]>(this.GROUPS_KEY);
    logger.debug('Loading groups', {
      component: 'StorageService',
      action: 'loadGroups',
      found: !!groupsData,
      count: groupsData ? groupsData.length : 0,
    });
    if (!groupsData) return [];
    try {
      return groupsData.map(data => {
        const group = new Group(data.id, data.name, data.description);

        // Convert the saved request data back to Request objects
        const requests = data.requests.map(
          req =>
            new Request(
              req.id,
              req.name,
              req.url,
              req.method,
              req.headers,
              req.body,
              req.description
            )
        );

        // Add the requests to the group
        requests.forEach(req => group.addRequest(req));

        return group;
      });
    } catch (e) {
      logger.error('Error parsing groups', {
        component: 'StorageService',
        action: 'loadGroups',
        error: (e as Error).message,
        data: groupsData,
      });
      return [];
    }
  }

  // Environments
  saveEnvironments(environments: Environment[]): void {
    const environmentData = environments.map(env => env.toJSON());
    this.setItem(this.ENVIRONMENTS_KEY, environmentData);
  }

  loadEnvironments(): Environment[] {
    const environmentsData = this.getItem<EnvironmentInterface[]>(this.ENVIRONMENTS_KEY);
    if (!environmentsData) return [];

    try {
      return environmentsData.map(
        data => new Environment(data.id, data.name, data.description, data.variables)
      );
    } catch (e) {
      logger.error('Error parsing environments', {
        component: 'StorageService',
        action: 'loadEnvironments',
        error: (e as Error).message,
      });
      return [];
    }
  }

  // Active Environment
  saveActiveEnvironment(environmentId: string | null): void {
    if (environmentId) {
      this.setItem(this.ACTIVE_ENV_KEY, environmentId);
    } else {
      this.removeItem(this.ACTIVE_ENV_KEY);
    }
  }

  loadActiveEnvironmentId(): string | null {
    return this.getItem<string>(this.ACTIVE_ENV_KEY);
  }

  // Recent Requests
  saveRecentRequests(requests: Request[]): void {
    // Store only the last 10 recent requests
    const requestsData = requests.slice(-10).map(req => req.toJSON());
    this.setItem(this.RECENT_REQUESTS_KEY, requestsData);
  }

  loadRecentRequests(): Request[] {
    const requestsData = this.getItem<RequestInterface[]>(this.RECENT_REQUESTS_KEY);
    if (!requestsData) return [];

    try {
      return requestsData.map(
        data =>
          new Request(
            data.id,
            data.name,
            data.url,
            data.method,
            data.headers,
            data.body,
            data.description
          )
      );
    } catch (e) {
      logger.error('Error parsing recent requests', {
        component: 'StorageService',
        action: 'loadRecentRequests',
        error: (e as Error).message,
      });
      return [];
    }
  }

  // Clear all data
  clearAllData(): void {
    logger.info('Clearing all storage data', {
      component: 'StorageService',
      action: 'clearAll',
    });
    this.removeItem(this.GROUPS_KEY);
    this.removeItem(this.ENVIRONMENTS_KEY);
    this.removeItem(this.ACTIVE_ENV_KEY);
    this.removeItem(this.RECENT_REQUESTS_KEY);

    // Cancella anche le vecchie chiavi
    this.removeItem('legacy_groups');
    this.removeItem('legacy_environments');
    this.removeItem('legacy_active_environment');
    this.removeItem('legacy_recent_requests');
  }

  // Metodo per migrare i dati dalle vecchie chiavi alle nuove
  migrateOldData(): void {
    logger.info('Starting data migration from legacy keys', {
      component: 'StorageService',
      action: 'migrateFromLegacyKeys',
    });

    try {
      // Check if there's data in the old keys
      const oldGroups = this.getItem<GroupInterface[]>('legacy_groups');
      const oldEnvironments = this.getItem<EnvironmentInterface[]>('legacy_environments');
      const oldActiveEnv = this.getItem<string>('legacy_active_environment');

      if (oldGroups && oldGroups.length > 0) {
        logger.info('Found legacy data, migrating to groups', {
          component: 'StorageService',
          action: 'migrateGroups',
        });
        this.setItem(this.GROUPS_KEY, oldGroups);
        this.removeItem('legacy_groups');
      }

      if (oldEnvironments && oldEnvironments.length > 0) {
        logger.info('Found legacy environments, migrating', {
          component: 'StorageService',
          action: 'migrateEnvironments',
        });
        this.setItem(this.ENVIRONMENTS_KEY, oldEnvironments);
        this.removeItem('legacy_environments');
      }

      if (oldActiveEnv) {
        logger.info('Found legacy active environment, migrating', {
          component: 'StorageService',
          action: 'migrateActiveEnvironment',
        });
        this.setItem(this.ACTIVE_ENV_KEY, oldActiveEnv);
        this.removeItem('legacy_active_environment');
      }
    } catch (e) {
      logger.error('Error during data migration', {
        component: 'StorageService',
        action: 'migrateFromLegacyKeys',
        error: (e as Error).message,
      });
    }
  }
}
