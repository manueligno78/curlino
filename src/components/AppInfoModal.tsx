import React, { useState, useEffect, useCallback } from 'react';
import { UpdateService, UpdateInfo, UpdateProgress } from '../services/UpdateService';
import { logger } from '../utils/BrowserLogger';
import '../styles/AppInfoModal.css';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  const [updateService] = useState(() => UpdateService.getInstance());
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloaded' | 'error'>(
    'none'
  );
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadAppVersion = useCallback(async () => {
    try {
      const version = await updateService.getAppVersion();
      setAppVersion(version);
    } catch (error) {
      logger.error('Error loading app version', {
        component: 'AppInfoModal',
        action: 'loadAppVersion',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [updateService]);

  const setupUpdateListeners = useCallback(() => {
    updateService.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info);
      setUpdateStatus('available');
      setIsCheckingUpdates(false);
    });

    updateService.onUpdateNotAvailable(() => {
      setUpdateStatus('none');
      setIsCheckingUpdates(false);
    });

    updateService.onUpdateError((error: Error) => {
      setUpdateError(error.message);
      setUpdateStatus('error');
      setIsCheckingUpdates(false);
      setIsDownloading(false);
    });

    updateService.onUpdateDownloadProgress((progress: UpdateProgress) => {
      setDownloadProgress(progress);
    });

    updateService.onUpdateDownloaded((info: UpdateInfo) => {
      setUpdateInfo(info);
      setUpdateStatus('downloaded');
      setIsDownloading(false);
      setDownloadProgress(null);
    });
  }, [updateService]);

  const removeUpdateListeners = () => {
    // In a real implementation, you'd want to properly clean up listeners
    // For now, we'll rely on the component unmounting
  };

  useEffect(() => {
    if (isOpen) {
      loadAppVersion();
      setupUpdateListeners();
    }
    return () => {
      removeUpdateListeners();
    };
  }, [isOpen, loadAppVersion, setupUpdateListeners]);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateError(null);
    setUpdateStatus('none');

    try {
      const result = await updateService.checkForUpdates();
      if (!result.success && result.error) {
        setUpdateError(result.error);
        setUpdateStatus('error');
        setIsCheckingUpdates(false);
      }
    } catch (error) {
      logger.error('Error checking for updates', {
        component: 'AppInfoModal',
        action: 'handleCheckForUpdates',
        error: error instanceof Error ? error.message : String(error)
      });
      setUpdateError(error instanceof Error ? error.message : 'Unknown error');
      setUpdateStatus('error');
      setIsCheckingUpdates(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setIsDownloading(true);
    setUpdateError(null);

    try {
      const result = await updateService.downloadUpdate();
      if (!result.success && result.error) {
        setUpdateError(result.error);
        setUpdateStatus('error');
        setIsDownloading(false);
      }
    } catch (error) {
      logger.error('Error downloading update', {
        component: 'AppInfoModal',
        action: 'handleDownloadUpdate',
        error: error instanceof Error ? error.message : String(error)
      });
      setUpdateError(error instanceof Error ? error.message : 'Unknown error');
      setUpdateStatus('error');
      setIsDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await updateService.installUpdate();
    } catch (error) {
      logger.error('Error installing update', error as Error);
      setUpdateError(error instanceof Error ? error.message : 'Unknown error');
      setUpdateStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal app-info-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">About Curlino</h2>
            <p className="modal-subtitle">Application information and updates</p>
          </div>
          <button onClick={onClose} className="modal-close" title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="app-info-section">
            <div className="app-logo-section">
              <div className="app-logo-large">🌐</div>
              <h3>Curlino</h3>
              <p className="app-tagline">Modern REST API Client</p>
            </div>

            <div className="app-details">
              <div className="detail-row">
                <span className="detail-label">Version:</span>
                <span className="detail-value">{appVersion}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Built with:</span>
                <span className="detail-value">Electron, React, TypeScript</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">License:</span>
                <span className="detail-value">MIT</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Repository:</span>
                <a
                  href="https://github.com/manueligno78/curlino"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  github.com/manueligno78/curlino
                </a>
              </div>
            </div>
          </div>

          {updateService.isUpdateSupported() && (
            <div className="updates-section">
              <h3>Updates</h3>

              <div className="update-status">
                {updateStatus === 'none' && !isCheckingUpdates && (
                  <p className="status-message">You&apos;re running the latest version</p>
                )}

                {isCheckingUpdates && (
                  <p className="status-message checking">Checking for updates...</p>
                )}

                {updateStatus === 'available' && updateInfo && (
                  <div className="update-available">
                    <p className="status-message available">
                      🎉 Update available: v{updateInfo.version}
                    </p>
                    {updateInfo.releaseNotes && (
                      <div className="release-notes">
                        <h4>Release Notes:</h4>
                        <p>{updateInfo.releaseNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {updateStatus === 'downloaded' && updateInfo && (
                  <div className="update-downloaded">
                    <p className="status-message downloaded">
                      ✅ Update v{updateInfo.version} ready to install
                    </p>
                    <p>Restart Curlino to complete the update</p>
                  </div>
                )}

                {updateStatus === 'error' && updateError && (
                  <p className="status-message error">❌ {updateError}</p>
                )}

                {isDownloading && downloadProgress && (
                  <div className="download-progress">
                    <p>Downloading update... {Math.round(downloadProgress.percent)}%</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${downloadProgress.percent}%` }}
                      />
                    </div>
                    <p className="download-details">
                      {(downloadProgress.transferred / 1024 / 1024).toFixed(1)}MB /
                      {(downloadProgress.total / 1024 / 1024).toFixed(1)}MB
                      {downloadProgress.bytesPerSecond > 0 &&
                        ` (${(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)}MB/s)`}
                    </p>
                  </div>
                )}
              </div>

              <div className="update-actions">
                {updateStatus === 'none' && !isCheckingUpdates && (
                  <button onClick={handleCheckForUpdates} className="btn btn-secondary">
                    Check for Updates
                  </button>
                )}

                {updateStatus === 'available' && !isDownloading && (
                  <button onClick={handleDownloadUpdate} className="btn btn-primary">
                    Download Update
                  </button>
                )}

                {updateStatus === 'downloaded' && (
                  <button onClick={handleInstallUpdate} className="btn btn-primary">
                    Install & Restart
                  </button>
                )}

                {isCheckingUpdates && (
                  <button className="btn btn-secondary" disabled>
                    Checking...
                  </button>
                )}

                {isDownloading && (
                  <button className="btn btn-secondary" disabled>
                    Downloading...
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="additional-info">
            <h3>Support</h3>
            <p>
              Found a bug or have a feature request?{' '}
              <a
                href="https://github.com/manueligno78/curlino/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="support-link"
              >
                Create an issue on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppInfoModal;
