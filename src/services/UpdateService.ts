import { logger } from '../utils/BrowserLogger';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

type UpdateAvailableCallback = (info: UpdateInfo) => void;
type UpdateNotAvailableCallback = (info: UpdateInfo) => void;
type UpdateErrorCallback = (error: Error) => void;
type UpdateProgressCallback = (progress: UpdateProgress) => void;
type UpdateDownloadedCallback = (info: UpdateInfo) => void;

export class UpdateService {
  private static instance: UpdateService | null = null;
  private isElectron: boolean;
  private updateAvailableCallbacks: UpdateAvailableCallback[] = [];
  private updateNotAvailableCallbacks: UpdateNotAvailableCallback[] = [];
  private updateErrorCallbacks: UpdateErrorCallback[] = [];
  private updateDownloadProgressCallbacks: UpdateProgressCallback[] = [];
  private updateDownloadedCallbacks: UpdateDownloadedCallback[] = [];

  constructor() {
    this.isElectron =
      typeof window !== 'undefined' && !!(window as unknown as { electron?: unknown }).electron;

    if (this.isElectron) {
      this.setupElectronUpdater();
    }

    logger.info('UpdateService initialized', { isElectron: this.isElectron });
  }

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  private setupElectronUpdater(): void {
    const electron = (
      window as unknown as {
        electron?: {
          onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
          onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => void;
          onUpdateError: (callback: (error: Error) => void) => void;
          onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => void;
          onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
        };
      }
    ).electron;

    if (electron) {
      // Setup event listeners
      electron.onUpdateAvailable((info: UpdateInfo) => {
        logger.info('Update available', info);
        this.updateAvailableCallbacks.forEach(callback => callback(info));
      });

      electron.onUpdateNotAvailable((info: UpdateInfo) => {
        logger.info('Update not available', info);
        this.updateNotAvailableCallbacks.forEach(callback => callback(info));
      });

      electron.onUpdateError((error: Error) => {
        logger.error('Update error', error);
        this.updateErrorCallbacks.forEach(callback => callback(error));
      });

      electron.onUpdateDownloadProgress((progress: UpdateProgress) => {
        logger.debug('Update download progress', progress);
        this.updateDownloadProgressCallbacks.forEach(callback => callback(progress));
      });

      electron.onUpdateDownloaded((info: UpdateInfo) => {
        logger.info('Update downloaded', info);
        this.updateDownloadedCallbacks.forEach(callback => callback(info));
      });
    }
  }

  public async checkForUpdates(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Updates only available in Electron app' };
    }

    try {
      const electron = (
        window as unknown as {
          electron?: {
            checkForUpdates: () => Promise<{ success: boolean; error?: string }>;
          };
        }
      ).electron;
      const result = await electron?.checkForUpdates();
      logger.info('Check for updates result', result);
      return result || { success: false, error: 'Electron API not available' };
    } catch (error) {
      logger.error('Error checking for updates', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Updates only available in Electron app' };
    }

    try {
      const electron = (
        window as unknown as {
          electron?: {
            downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
          };
        }
      ).electron;
      const result = await electron?.downloadUpdate();
      logger.info('Download update result', result);
      return result || { success: false, error: 'Electron API not available' };
    } catch (error) {
      logger.error('Error downloading update', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async installUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Updates only available in Electron app' };
    }

    try {
      const electron = (
        window as unknown as {
          electron?: {
            installUpdate: () => Promise<{ success: boolean; error?: string }>;
          };
        }
      ).electron;
      const result = await electron?.installUpdate();
      logger.info('Install update result', result);
      return result || { success: false, error: 'Electron API not available' };
    } catch (error) {
      logger.error('Error installing update', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async getAppVersion(): Promise<string> {
    if (!this.isElectron) {
      return '1.0.0'; // Fallback version for web
    }

    try {
      const electron = (
        window as unknown as {
          electron?: {
            getVersion: () => Promise<string>;
          };
        }
      ).electron;
      const version = await electron?.getVersion();
      return version || '1.0.0';
    } catch (error) {
      logger.error('Error getting app version', error);
      return '1.0.0';
    }
  }

  // Event handlers
  public onUpdateAvailable(callback: UpdateAvailableCallback): void {
    this.updateAvailableCallbacks.push(callback);
  }

  public onUpdateNotAvailable(callback: UpdateNotAvailableCallback): void {
    this.updateNotAvailableCallbacks.push(callback);
  }

  public onUpdateError(callback: UpdateErrorCallback): void {
    this.updateErrorCallbacks.push(callback);
  }

  public onUpdateDownloadProgress(callback: UpdateProgressCallback): void {
    this.updateDownloadProgressCallbacks.push(callback);
  }

  public onUpdateDownloaded(callback: UpdateDownloadedCallback): void {
    this.updateDownloadedCallbacks.push(callback);
  }

  // Remove event handlers
  public removeUpdateAvailableListener(callback: UpdateAvailableCallback): void {
    const index = this.updateAvailableCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateAvailableCallbacks.splice(index, 1);
    }
  }

  public removeUpdateNotAvailableListener(callback: UpdateNotAvailableCallback): void {
    const index = this.updateNotAvailableCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateNotAvailableCallbacks.splice(index, 1);
    }
  }

  public removeUpdateErrorListener(callback: UpdateErrorCallback): void {
    const index = this.updateErrorCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateErrorCallbacks.splice(index, 1);
    }
  }

  public removeUpdateDownloadProgressListener(callback: UpdateProgressCallback): void {
    const index = this.updateDownloadProgressCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateDownloadProgressCallbacks.splice(index, 1);
    }
  }

  public removeUpdateDownloadedListener(callback: UpdateDownloadedCallback): void {
    const index = this.updateDownloadedCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateDownloadedCallbacks.splice(index, 1);
    }
  }

  public isUpdateSupported(): boolean {
    return this.isElectron;
  }
}
