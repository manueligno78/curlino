import React, { useState, useEffect } from 'react';
import { AppSettings } from '../models/Settings';
import { SettingsService } from '../services/SettingsService';
import { Environment } from '../models/Environment';
import { ThemeManager } from '../utils/ThemeManager';
import { logger } from '../utils/BrowserLogger';
import EnvironmentModal from './EnvironmentModal';
import '../styles/SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  activeEnvironment?: Environment;
  onEnvironmentChange: (environmentId: string | null) => void;
  onNewEnvironment: (name: string) => void;
  onRemoveEnvironment: (environmentId: string) => void;
  onUpdateEnvironment: (environment: Environment) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  environments,
  activeEnvironment,
  onEnvironmentChange,
  onNewEnvironment,
  onRemoveEnvironment,
  onUpdateEnvironment,
}) => {
  const [settingsService] = useState(() => new SettingsService());
  const [themeManager] = useState(() => ThemeManager.getInstance());
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());
  const [activeTab, setActiveTab] = useState<'general' | 'environments' | 'advanced'>('general');
  const [isDirty, setIsDirty] = useState(false);

  // Environment management
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [_environmentToDelete, __setEnvironmentToDelete] = useState<Environment | null>(null);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getSettings());
      setIsDirty(false);
    }
  }, [isOpen, settingsService]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  const handleSave = () => {
    try {
      settingsService.updateSettings(settings);
      setIsDirty(false);
      logger.info('Settings saved successfully', {
        component: 'SettingsModal',
        action: 'saveSettings',
      });
    } catch (error) {
      logger.error('Failed to save settings', {
        component: 'SettingsModal',
        action: 'saveSettings',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    themeManager.setTheme(theme);
    updateSetting('theme', { ...settings.theme, mode: theme });
  };

  const handleAddEnvironment = () => {
    if (newEnvironmentName.trim()) {
      onNewEnvironment(newEnvironmentName.trim());
      setNewEnvironmentName('');
      setIsAddingEnvironment(false);
    }
  };

  const handleDeleteEnvironment = (env: Environment) => {
    if (window.confirm(`Are you sure you want to delete "${env.name}"?`)) {
      onRemoveEnvironment(env.id);
      _setEnvironmentToDelete(null);
    }
  };

  const settingsSections = [
    {
      key: 'general',
      label: 'General',
      icon: '⚙️',
      description: 'Theme, appearance, and basic settings',
    },
    {
      key: 'environments',
      label: 'Environments',
      icon: '🌍',
      description: 'Manage API environments and variables',
    },
    {
      key: 'advanced',
      label: 'Advanced',
      icon: '🔧',
      description: 'Developer options and performance settings',
    },
  ];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Settings</h2>
            <p className="modal-subtitle">Configure Curlino to match your workflow</p>
          </div>

          <div className="modal-header-actions">
            {isDirty && (
              <button onClick={handleSave} className="btn btn-primary btn-sm">
                Save Changes
              </button>
            )}
            <button onClick={handleClose} className="modal-close" title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Settings Navigation */}
          <div className="settings-nav">
            {settingsSections.map(section => (
              <button
                key={section.key}
                onClick={() => setActiveTab(section.key as any)}
                className={`nav-item ${activeTab === section.key ? 'active' : ''}`}
              >
                <span className="nav-icon">{section.icon}</span>
                <div className="nav-content">
                  <div className="nav-label">{section.label}</div>
                  <div className="nav-description">{section.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3>Appearance</h3>

                <div className="setting-group">
                  <label className="setting-label">
                    <span className="label-text">Theme</span>
                    <span className="label-description">Choose your preferred color scheme</span>
                  </label>

                  <div className="theme-selector">
                    {[
                      { key: 'light', label: 'Light', icon: '☀️' },
                      { key: 'dark', label: 'Dark', icon: '🌙' },
                      { key: 'auto', label: 'Auto', icon: '💻' },
                    ].map(theme => (
                      <button
                        key={theme.key}
                        onClick={() => handleThemeChange(theme.key as any)}
                        className={`theme-option ${themeManager.getCurrentTheme() === theme.key ? 'active' : ''}`}
                      >
                        <span className="theme-icon">{theme.icon}</span>
                        <span className="theme-label">{theme.label}</span>
                        {theme.key === 'auto' && <span className="theme-hint">Follows system</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <span className="label-text">Font Size</span>
                    <span className="label-description">Adjust interface text size</span>
                  </label>

                  <select
                    value={settings.appearance?.fontSize || 'medium'}
                    onChange={e =>
                      updateSetting('appearance', {
                        ...settings.appearance,
                        fontSize: e.target.value as any,
                      })
                    }
                    className="select"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <h3>Behavior</h3>

                <div className="setting-group">
                  <label className="setting-label">
                    <span className="label-text">Request Timeout</span>
                    <span className="label-description">
                      Default timeout for API requests (seconds)
                    </span>
                  </label>

                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={settings.request?.timeout || 30}
                    onChange={e =>
                      updateSetting('request', {
                        ...settings.request,
                        timeout: parseInt(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>

                <div className="setting-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.request?.followRedirects ?? true}
                        onChange={e =>
                          updateSetting('request', {
                            ...settings.request,
                            followRedirects: e.target.checked,
                          })
                        }
                      />
                      <span className="checkbox-text">Follow redirects automatically</span>
                    </label>
                  </div>
                </div>

                <div className="setting-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.request?.validateSSL ?? true}
                        onChange={e =>
                          updateSetting('request', {
                            ...settings.request,
                            validateSSL: e.target.checked,
                          })
                        }
                      />
                      <span className="checkbox-text">Validate SSL certificates</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Environments Tab */}
            {activeTab === 'environments' && (
              <div className="settings-section">
                <div className="section-header">
                  <h3>Environments</h3>
                  <button
                    onClick={() => setIsAddingEnvironment(true)}
                    className="btn btn-primary btn-sm"
                  >
                    + New Environment
                  </button>
                </div>

                {isAddingEnvironment && (
                  <div className="add-environment-form">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Environment name"
                        value={newEnvironmentName}
                        onChange={e => setNewEnvironmentName(e.target.value)}
                        className="input"
                        autoFocus
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        onClick={handleAddEnvironment}
                        disabled={!newEnvironmentName.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingEnvironment(false);
                          setNewEnvironmentName('');
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="environments-list">
                  {environments.length > 0 ? (
                    environments.map(env => (
                      <div key={env.id} className="environment-item">
                        <div className="environment-info">
                          <div className="environment-name">
                            {env.name}
                            {activeEnvironment?.id === env.id && (
                              <span className="active-badge">Active</span>
                            )}
                          </div>
                          <div className="environment-meta">
                            {Object.keys(env.variables).length} variable
                            {Object.keys(env.variables).length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        <div className="environment-actions">
                          <button
                            onClick={() => onEnvironmentChange(env.id)}
                            className={`btn btn-sm ${activeEnvironment?.id === env.id ? 'btn-ghost' : 'btn-secondary'}`}
                            disabled={activeEnvironment?.id === env.id}
                          >
                            {activeEnvironment?.id === env.id ? 'Active' : 'Use'}
                          </button>
                          <button
                            onClick={() => setEditingEnvironment(env)}
                            className="btn btn-ghost btn-sm"
                            title="Edit environment"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteEnvironment(env)}
                            className="btn btn-ghost btn-sm"
                            title="Delete environment"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🌍</div>
                      <h4>No environments</h4>
                      <p>Create an environment to manage API variables</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="settings-section">
                <h3>Developer Options</h3>

                <div className="setting-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.advanced?.enableDevtools ?? false}
                        onChange={e =>
                          updateSetting('advanced', {
                            ...settings.advanced,
                            enableDevtools: e.target.checked,
                          })
                        }
                      />
                      <span className="checkbox-text">Enable developer tools</span>
                    </label>
                  </div>
                </div>

                <div className="setting-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.advanced?.verboseLogging ?? false}
                        onChange={e =>
                          updateSetting('advanced', {
                            ...settings.advanced,
                            verboseLogging: e.target.checked,
                          })
                        }
                      />
                      <span className="checkbox-text">Verbose logging</span>
                    </label>
                  </div>
                </div>

                <h3>Performance</h3>

                <div className="setting-group">
                  <label className="setting-label">
                    <span className="label-text">History Limit</span>
                    <span className="label-description">
                      Maximum number of requests to keep in history
                    </span>
                  </label>

                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.performance?.historyLimit || 100}
                    onChange={e =>
                      updateSetting('performance', {
                        ...settings.performance,
                        historyLimit: parseInt(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>

                <h3>Reset</h3>

                <div className="setting-group">
                  <button
                    onClick={() => {
                      if (
                        window.confirm('Reset all settings to defaults? This cannot be undone.')
                      ) {
                        const defaultSettings = settingsService.getDefaultSettings();
                        setSettings(defaultSettings);
                        settingsService.updateSettings(defaultSettings);
                        setIsDirty(false);
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            {isDirty && (
              <span className="unsaved-notice">
                <span className="notice-icon">●</span>
                Unsaved changes
              </span>
            )}
          </div>

          <div className="footer-actions">
            <button onClick={handleClose} className="btn btn-ghost">
              Close
            </button>
            {isDirty && (
              <button onClick={handleSave} className="btn btn-primary">
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Environment Edit Modal */}
      {editingEnvironment && (
        <EnvironmentModal
          isOpen={true}
          onClose={() => setEditingEnvironment(null)}
          environment={editingEnvironment}
          onSave={updatedEnv => {
            onUpdateEnvironment(updatedEnv);
            setEditingEnvironment(null);
          }}
        />
      )}
    </div>
  );
};
