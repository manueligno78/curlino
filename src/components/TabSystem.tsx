import React from 'react';
import { Request } from '../models/Request';

interface Tab {
  id: string;
  title: string;
  request: Request;
  response?: any;
}

interface TabSystemProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onNewTab: () => void;
  onTabClose: (tabId: string) => void;
}

const TabSystem: React.FC<TabSystemProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onNewTab,
  onTabClose,
}) => {
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  return (
    <div className="tab-system">
      <div className="tab-header">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''} method-${tab.request.method.toLowerCase()}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="method-badge">{tab.request.method}</span>
            <span className="tab-title">{tab.title}</span>
            <button
              className="tab-close-btn"
              onClick={e => handleTabClose(e, tab.id)}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button className="new-tab-btn" onClick={onNewTab} title="New tab">
          +
        </button>
      </div>
    </div>
  );
};

export default TabSystem;
