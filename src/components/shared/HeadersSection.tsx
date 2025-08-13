import React from 'react';

interface HeadersSectionProps {
  /** Headers data - for request panel it's editable, for response it's read-only */
  headers: Array<{ key: string; value: string; enabled?: boolean }> | Record<string, string>;
  /** Whether the section is collapsed */
  isCollapsed: boolean;
  /** Callback when collapse state changes */
  onToggleCollapse: () => void;
  /** Whether this is editable (request) or read-only (response) */
  mode: 'editable' | 'readonly';
  /** Callbacks for editable mode */
  onUpdateHeader?: (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => void;
  onRemoveHeader?: (index: number) => void;
  onAddHeader?: () => void;
}

const HeadersSection: React.FC<HeadersSectionProps> = ({
  headers,
  isCollapsed,
  onToggleCollapse,
  mode,
  onUpdateHeader,
  onRemoveHeader,
  onAddHeader,
}) => {
  // Convert headers to array format for consistent handling
  const headersList = Array.isArray(headers)
    ? headers
    : Object.entries(headers).map(([key, value]) => ({ key, value, enabled: true }));

  // Count enabled headers
  const enabledCount =
    mode === 'readonly' ? headersList.length : headersList.filter(h => h.enabled && h.key).length;

  return (
    <div className="panel-section">
      <h3 className="section-title clickable" onClick={onToggleCollapse}>
        <span className={`collapse-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>▶</span>
        Headers
        {enabledCount > 0 && <span className="badge">{enabledCount}</span>}
      </h3>
      {!isCollapsed && (
        <div className="headers-section">
          <div className={mode === 'editable' ? 'headers-table' : 'response-headers'}>
            {headersList.map((header, index) => (
              <div key={index} className="header-row">
                {mode === 'editable' ? (
                  // Editable mode for RequestPanel
                  <>
                    <input
                      type="checkbox"
                      checked={header.enabled ?? true}
                      onChange={e => onUpdateHeader?.(index, 'enabled', e.target.checked)}
                      className="header-checkbox"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={e => onUpdateHeader?.(index, 'key', e.target.value)}
                      placeholder="Header name"
                      className="input header-key"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={e => onUpdateHeader?.(index, 'value', e.target.value)}
                      placeholder="Header value"
                      className="input header-value"
                    />
                    <button
                      onClick={() => onRemoveHeader?.(index)}
                      className="btn btn-ghost btn-sm header-remove"
                      title="Remove header"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  // Read-only mode for ResponsePanel
                  <>
                    <div className="header-key">{header.key}</div>
                    <div className="header-value">{header.value}</div>
                  </>
                )}
              </div>
            ))}
            {enabledCount === 0 && (
              <div className="empty-headers">
                {mode === 'editable' ? 'No headers added' : 'No headers available'}
              </div>
            )}
          </div>
          {mode === 'editable' && (
            <button onClick={onAddHeader} className="btn btn-ghost add-header-btn">
              + Add Header
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HeadersSection;
