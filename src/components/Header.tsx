import React, { useState, useEffect } from 'react';
import { ThemeManager } from '../utils/ThemeManager';
import curlinoLogo from '@/assets/images/curlino-logo.svg';

interface HeaderProps {
  onImportRequest?: (url: string) => void;
  onToggleHistory?: () => void;
  onActivateBuilder?: () => void;
  onThemeToggle?: () => void;
  onSettingsToggle?: () => void;
  activeView: 'import' | 'builder' | 'history' | 'settings';
  darkTheme?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onImportRequest,
  onToggleHistory,
  onActivateBuilder,
  onThemeToggle,
  onSettingsToggle,
  activeView,
  darkTheme: _darkTheme = false,
}) => {
  const [themeManager] = useState(() => ThemeManager.getInstance());
  const [themeIcon, setThemeIcon] = useState(themeManager.getThemeIcon());

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeIcon(themeManager.getThemeIcon());
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, [themeManager]);

  const handleThemeClick = () => {
    themeManager.toggleTheme();
    if (onThemeToggle) onThemeToggle();
  };

  return (
    <header className="app-header">
      <div className="logo-container">
        <img src={curlinoLogo} alt="Curlino logo" className="app-logo" />
        <h1>Curlino</h1>
        <span className="version">v1.0.0</span>
      </div>
      <nav className="main-nav">
        <ul>
          <li>
            <button
              className={`nav-button ${activeView === 'import' ? 'active' : ''}`}
              onClick={() => {
                if (onImportRequest) onImportRequest('__VIEW_CHANGE__');
              }}
              disabled={activeView === 'import'}
            >
              Import
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${activeView === 'builder' ? 'active' : ''}`}
              onClick={onActivateBuilder}
              disabled={activeView === 'builder'}
            >
              Builder
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${activeView === 'history' ? 'active' : ''}`}
              onClick={onToggleHistory}
              disabled={activeView === 'history'}
            >
              History
            </button>
          </li>
        </ul>
      </nav>
      <div className="user-section">
        <button
          className="theme-toggle"
          onClick={handleThemeClick}
          title={`Switch to ${themeManager.getNextTheme()} theme`}
        >
          {themeIcon}
        </button>
        <button
          className={`settings-button ${activeView === 'settings' ? 'active' : ''}`}
          onClick={onSettingsToggle}
          title="Settings"
        >
          ⚙️
        </button>
        <button className="help-button" title="Help">
          ?
        </button>
      </div>
    </header>
  );
};

export default Header;
