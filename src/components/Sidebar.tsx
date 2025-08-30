import React, { useState } from 'react';
import { Group } from '../models/Group';
import { Environment } from '../models/Environment';
import { Request } from '../models/Request';
import { ApiService } from '../services/ApiService';

interface SidebarProps {
  groups: Group[];
  environments: Environment[];
  activeEnvironment?: Environment;
  onEnvironmentChange: (environmentId: string | null) => void;
  onRequestSelect: (request: Request) => void;
  onNewGroup: (name: string) => void;
  onNewEnvironment: (name: string) => void;
  onRemoveGroup: (_groupId: string) => void;
  onRemoveRequestFromGroup: (_groupId: string, requestId: string) => void;
  onRemoveEnvironment: (environmentId: string) => void;
  onImportGroups: (groups: Group[]) => void;
  onUpdateEnvironment?: (environment: Environment) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  groups,
  environments: _environments,
  activeEnvironment: _activeEnvironment,
  onEnvironmentChange: _onEnvironmentChange,
  onRequestSelect,
  onNewGroup,
  onNewEnvironment: _onNewEnvironment,
  onRemoveGroup,
  onRemoveRequestFromGroup,
  onRemoveEnvironment: _onRemoveEnvironment,
  onImportGroups,
  onUpdateEnvironment: _onUpdateEnvironment,
}) => {
  const [_activeTab, _setActiveTab] = useState<'groups'>('groups');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(260); // larghezza iniziale px
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    _group: Group | null;
  } | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = React.useRef<HTMLDivElement>(null);

  const toggleGroupExpanded = (_groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [_groupId]: !prev[_groupId],
    }));
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onNewGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  // Gestione resize della sidebar
  const handleMouseDown = (_e: React.MouseEvent) => {
    setIsResizing(true);
  };

  // Gestione drag per resize
  React.useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 180;
      const maxWidth = 500;
      let newWidth = e.clientX;
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Se sidebar è collassata, larghezza minima
  const sidebarStyle: React.CSSProperties = isSidebarCollapsed
    ? { width: 36, minWidth: 36, maxWidth: 36 }
    : { width: sidebarWidth, minWidth: 180, maxWidth: 500 };

  // Funzione per esportare una _group come JSON e scaricare il file
  const _handleExportGroup = (__group: Group) => {
    const json = ApiService.exportGroupsToJson([__group]);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${__group.name || 'group'}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Chiudi il menu contestuale su click fuori
  React.useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // Gestione click fuori dal menu add
  React.useEffect(() => {
    if (!addMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [addMenuOpen]);

  // Funzione per importare _group da file JSON
  const handleImportGroupJson = async () => {
    setAddMenuOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = ApiService.importGroupsFromJson(text, groups);
        if (imported.length === 0) {
          alert('Nessuna nuova _group importata: già presente nel workspace.');
          return;
        }
        onImportGroups(imported); // AGGIUNTO: aggiunge direttamente le _group importate
        window.dispatchEvent(new Event('_groupNameChanged'));
        alert('Group importata con successo!');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
        alert('Errore importazione: ' + errorMessage);
      }
    };
    input.click();
  };

  return (
    <div
      className={`sidebar-wrapper${isSidebarCollapsed ? ' collapsed' : ''}`}
      style={sidebarStyle}
    >
      <button
        className="sidebar-toggle-btn"
        title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        onClick={() => setIsSidebarCollapsed(c => !c)}
      >
        {isSidebarCollapsed ? '▶' : '◀'}
      </button>
      {!isSidebarCollapsed && (
        <div className="sidebar">
          <div className="sidebar-content">
            <div className="groups-list">
              <div className="sidebar-header">
                <h3>Groups</h3>
                <div style={{ position: 'relative', display: 'inline-block' }} ref={addMenuRef}>
                  <button
                    className="add-btn"
                    onClick={() => setAddMenuOpen(v => !v)}
                    title="Add or import _group"
                  >
                    +
                  </button>
                  {addMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 32,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 10000,
                        minWidth: 140,
                        padding: '4px 0',
                      }}
                    >
                      <div
                        style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
                        onClick={() => {
                          setAddMenuOpen(false);
                          setIsAddingGroup(true);
                        }}
                      >
                        Create new
                      </div>
                      <div
                        style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
                        onClick={handleImportGroupJson}
                      >
                        Import json
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isAddingGroup && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Group name"
                  />
                  <div className="form-buttons">
                    <button onClick={handleAddGroup}>Add</button>
                    <button onClick={() => setIsAddingGroup(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <ul className="groups">
                {groups.map(_group => (
                  <li key={_group.id} className="_group-item">
                    <div
                      className="_group-header"
                      onClick={() => toggleGroupExpanded(_group.id)}
                      onContextMenu={e => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, _group });
                      }}
                      onMouseDown={e => {
                        if (e.button === 0 && e.ctrlKey) {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, _group });
                        }
                      }}
                    >
                      <span className={`arrow ${expandedGroups[_group.id] ? 'expanded' : ''}`}>
                        ▶
                      </span>
                      {editingGroupId === _group.id ? (
                        <input
                          className="_group-edit-input"
                          type="text"
                          value={editingGroupName}
                          autoFocus
                          onChange={e => setEditingGroupName(e.target.value)}
                          onBlur={() => {
                            if (editingGroupName.trim() && editingGroupName !== _group.name) {
                              // Aggiorna il nome della _group
                              _group.name = editingGroupName.trim();
                              // Forza il re-render e la persistenza
                              if (typeof window !== 'undefined')
                                window.dispatchEvent(new Event('_groupNameChanged'));
                            }
                            setEditingGroupId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === 'Escape') {
                              setEditingGroupId(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="_group-name"
                          onDoubleClick={e => {
                            e.stopPropagation();
                            setEditingGroupId(_group.id);
                            setEditingGroupName(_group.name);
                          }}
                        >
                          {_group.name}
                        </span>
                      )}
                      <button
                        className="remove-_group-btn x-red"
                        title="Remove _group"
                        onClick={e => {
                          e.stopPropagation();
                          onRemoveGroup(_group.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {expandedGroups[_group.id] && (
                      <ul className="requests-list">
                        {_group.requests.map(request => (
                          <li key={request.id} className="request-item">
                            <span className={`method ${request.method.toLowerCase()}`}>
                              {request.method}
                            </span>
                            <span
                              className="request-name"
                              onClick={() => onRequestSelect(request)}
                              title={request.name}
                              style={{
                                maxWidth: 120,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                verticalAlign: 'middle',
                              }}
                            >
                              {request.name.length > 28
                                ? request.name.slice(0, 25) + '…'
                                : request.name}
                            </span>
                            <button
                              className="remove-request-btn"
                              title="Rimuovi dalla _group"
                              onClick={e => {
                                e.stopPropagation();
                                onRemoveRequestFromGroup(_group.id, request.id);
                              }}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                        {_group.requests.length === 0 && (
                          <li className="no-items">No requests in this _group</li>
                        )}
                      </ul>
                    )}
                  </li>
                ))}
                {groups.length === 0 && <li className="no-items">No groups</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Handle per resize, visibile solo se non collassata */}
      {!isSidebarCollapsed && (
        <div className="sidebar-resize-handle" onMouseDown={handleMouseDown} />
      )}
    </div>
  );
};

export default Sidebar;
