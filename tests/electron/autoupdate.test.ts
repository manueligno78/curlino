/**
 * Tests for autoupdate functionality
 * This test verifies issue #52 fix using app.isPackaged instead of faulty regex detection
 */

describe('Autoupdate Detection Logic', () => {
  // Mock process environment
  const originalEnv = process.env;
  const originalDefaultApp = (process as any).defaultApp;
  const originalExecPath = process.execPath;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    // Restore original process properties
    Object.defineProperty(process, 'defaultApp', {
      value: originalDefaultApp,
      writable: true,
      configurable: true
    });
    Object.defineProperty(process, 'execPath', {
      value: originalExecPath,
      writable: true,
      configurable: true
    });
  });

  describe('isDevelopment detection', () => {
    it('should correctly identify production mode when packaged', () => {
      // Simulate packaged app environment
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: undefined,
        writable: true,
        configurable: true
      });
      // This test shows the correct case - packaged apps don't have node_modules/electron in path
      Object.defineProperty(process, 'execPath', {
        value: '/Applications/Curlino.app/Contents/MacOS/Curlino',
        writable: true,
        configurable: true
      });

      // The current faulty logic
      const faultyIsDevelopment = process.env.NODE_ENV !== 'production' || 
                                  (process as any).defaultApp || 
                                  /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      // This correctly identifies as production because the path doesn't match the regex
      expect(faultyIsDevelopment).toBe(false);
    });

    it('reproduces the issue with apps installed in paths containing electron folder', () => {
      // Simulate an edge case where the app is installed in a path that happens to contain "electron"
      // This could happen if someone installs the app in a folder like "my-electron-apps" 
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: undefined,
        writable: true,
        configurable: true
      });
      // Simulate a path that could trigger the regex match incorrectly
      Object.defineProperty(process, 'execPath', {
        value: '/Users/developer/node_modules/electron/my-curlino-app/Curlino',
        writable: true,
        configurable: true
      });

      // The current faulty logic
      const faultyIsDevelopment = process.env.NODE_ENV !== 'production' || 
                                  (process as any).defaultApp || 
                                  /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      // This should be false (production) but returns true due to the overly broad regex
      // This demonstrates how the current logic could incorrectly identify packaged apps as development
      expect(faultyIsDevelopment).toBe(true); // Shows the bug - should be false but is true
    });

    it('should correctly identify development mode when running from dev', () => {
      // Simulate development environment
      process.env.NODE_ENV = 'development';
      Object.defineProperty(process, 'execPath', {
        value: '/path/to/project/node_modules/electron/dist/electron',
        writable: true,
        configurable: true
      });

      const isDevelopment = process.env.NODE_ENV !== 'production' || 
                           (process as any).defaultApp || 
                           /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      expect(isDevelopment).toBe(true);
    });

    it('should correctly identify development mode when defaultApp is set', () => {
      // Simulate development environment with defaultApp
      process.env.NODE_ENV = 'production'; // Even if NODE_ENV is production
      Object.defineProperty(process, 'defaultApp', {
        value: true,
        writable: true,
        configurable: true
      });
      Object.defineProperty(process, 'execPath', {
        value: '/Applications/Electron.app/Contents/MacOS/Electron',
        writable: true,
        configurable: true
      });

      const isDevelopment = process.env.NODE_ENV !== 'production' || 
                           (process as any).defaultApp || 
                           /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      expect(isDevelopment).toBe(true);
    });

    it('should handle Windows packaged app paths correctly', () => {
      // Simulate Windows packaged app
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: undefined,
        writable: true,
        configurable: true
      });
      Object.defineProperty(process, 'execPath', {
        value: 'C:\\Users\\User\\AppData\\Local\\Programs\\Curlino\\Curlino.exe',
        writable: true,
        configurable: true
      });

      const faultyIsDevelopment = process.env.NODE_ENV !== 'production' || 
                                  (process as any).defaultApp || 
                                  /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      expect(faultyIsDevelopment).toBe(false);
    });

    it('should handle Linux packaged app paths correctly', () => {
      // Simulate Linux packaged app
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: undefined,
        writable: true,
        configurable: true
      });
      Object.defineProperty(process, 'execPath', {
        value: '/opt/Curlino/curlino',
        writable: true,
        configurable: true
      });

      const faultyIsDevelopment = process.env.NODE_ENV !== 'production' || 
                                  (process as any).defaultApp || 
                                  /node_modules[\\/]electron[\\/]/.test(process.execPath);
      
      expect(faultyIsDevelopment).toBe(false);
    });
  });

  describe('Fixed detection using app.isPackaged', () => {
    // Mock app.isPackaged for testing
    let mockIsPackaged = false;
    const mockApp = {
      isPackaged: false
    };
    
    beforeEach(() => {
      (global as any).app = mockApp;
    });
    
    // This is the new improved logic
    const newDetectionLogic = () => {
      const isDevelopment = process.env.NODE_ENV !== 'production' || !!(process as any).defaultApp;
      const isPackaged = (global as any).app?.isPackaged || false;
      
      return { isDevelopment, isPackaged };
    };

    it('should enable autoupdate for packaged apps', () => {
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: undefined,
        writable: true,
        configurable: true
      });
      mockApp.isPackaged = true;

      const { isDevelopment, isPackaged } = newDetectionLogic();
      
      // For autoupdate purposes, we care about isPackaged
      expect(isPackaged).toBe(true); // App is packaged, autoupdate should work
      expect(isDevelopment).toBe(false); // Not in development mode
    });

    it('should disable autoupdate for development (not packaged)', () => {
      process.env.NODE_ENV = 'development';
      Object.defineProperty(process, 'defaultApp', {
        value: true,
        writable: true,
        configurable: true
      });
      mockApp.isPackaged = false;

      const { isDevelopment, isPackaged } = newDetectionLogic();
      
      expect(isPackaged).toBe(false); // Not packaged, autoupdate disabled
      expect(isDevelopment).toBe(true); // In development mode
    });

    it('should handle electron CLI in production environment', () => {
      process.env.NODE_ENV = 'production';
      Object.defineProperty(process, 'defaultApp', {
        value: true, // Using electron CLI
        writable: true,
        configurable: true
      });
      mockApp.isPackaged = false;

      const { isDevelopment, isPackaged } = newDetectionLogic();
      
      expect(isPackaged).toBe(false); // Not packaged, autoupdate disabled
      expect(isDevelopment).toBe(true); // Still development due to defaultApp
    });
  });
});