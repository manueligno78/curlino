import React from 'react';

interface QueryParamsSectionProps {
  /** Query parameters data */
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  /** Whether the section is collapsed */
  isCollapsed: boolean;
  /** Callback when collapse state changes */
  onToggleCollapse: () => void;
  /** Callbacks for managing query parameters */
  onUpdateQueryParam: (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => void;
  onRemoveQueryParam: (index: number) => void;
  onAddQueryParam: () => void;
}

const QueryParamsSection: React.FC<QueryParamsSectionProps> = ({
  queryParams,
  isCollapsed,
  onToggleCollapse,
  onUpdateQueryParam,
  onRemoveQueryParam,
  onAddQueryParam,
}) => {
  // Count enabled query parameters
  const enabledCount = queryParams.filter(q => q.enabled && q.key).length;

  return (
    <div className="panel-section">
      <h3 className="section-title clickable" onClick={onToggleCollapse}>
        <span className={`collapse-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>▶</span>
        Query Parameters
        {enabledCount > 0 && <span className="badge">{enabledCount}</span>}
      </h3>
      {!isCollapsed && (
        <div className="headers-section">
          {' '}
          {/* Reuse headers styles */}
          <div className="headers-table">
            {' '}
            {/* Reuse headers table styles */}
            {queryParams.map((param, index) => (
              <div key={index} className="header-row">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={e => onUpdateQueryParam(index, 'enabled', e.target.checked)}
                  className="header-checkbox"
                />
                <input
                  type="text"
                  value={param.key}
                  onChange={e => onUpdateQueryParam(index, 'key', e.target.value)}
                  placeholder="Parameter name"
                  className="input header-key"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={e => onUpdateQueryParam(index, 'value', e.target.value)}
                  placeholder="Parameter value"
                  className="input header-value"
                />
                <button
                  onClick={() => onRemoveQueryParam(index)}
                  className="btn btn-ghost btn-sm header-remove"
                  title="Remove parameter"
                >
                  ✕
                </button>
              </div>
            ))}
            {enabledCount === 0 && <div className="empty-headers">No query parameters added</div>}
          </div>
          <button onClick={onAddQueryParam} className="btn btn-ghost add-header-btn">
            + Add Parameter
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryParamsSection;
