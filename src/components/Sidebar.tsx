import React, { useState } from 'react';
import { Collection } from '../models/Collection';
import { Environment } from '../models/Environment';
import { Request } from '../models/Request';
import { ApiService } from '../services/ApiService';

interface SidebarProps {
  collections: Collection[];
  environments: Environment[];
  activeEnvironment?: Environment;
  onEnvironmentChange: (environmentId: string | null) => void;
  onRequestSelect: (request: Request) => void;
  onNewCollection: (name: string) => void;
  onNewEnvironment: (name: string) => void;
  onRemoveCollection: (_collectionId: string) => void;
  onRemoveRequestFromCollection: (_collectionId: string, requestId: string) => void;
  onRemoveEnvironment: (environmentId: string) => void;
  onImportCollections: (collections: Collection[]) => void;
  onUpdateEnvironment?: (environment: Environment) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collections,
  environments: _environments,
  activeEnvironment: _activeEnvironment,
  onEnvironmentChange: _onEnvironmentChange,
  onRequestSelect,
  onNewCollection,
  onNewEnvironment: _onNewEnvironment,
  onRemoveCollection,
  onRemoveRequestFromCollection,
  onRemoveEnvironment: _onRemoveEnvironment,
  onImportCollections,
  onUpdateEnvironment: _onUpdateEnvironment,
}) => {
  const [_activeTab, _setActiveTab] = useState<'collections'>('collections');
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [isAddingCollection, setIsAddingCollection] = useState<boolean>(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(260); // larghezza iniziale px
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    _collection: Collection | null;
  } | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = React.useRef<HTMLDivElement>(null);

  const toggleCollectionExpanded = (_collectionId: string) => {
    setExpandedCollections(prev => ({
      ...prev,
      [_collectionId]: !prev[_collectionId],
    }));
  };

  const handleAddCollection = () => {
    if (newCollectionName.trim()) {
      onNewCollection(newCollectionName.trim());
      setNewCollectionName('');
      setIsAddingCollection(false);
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

  // Funzione per esportare una _collection come JSON e scaricare il file
  const _handleExportCollection = (__collection: Collection) => {
    const json = ApiService.exportCollectionsToJson([__collection]);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${__collection.name || 'collection'}.json`;
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

  // Funzione per importare _collection da file JSON
  const handleImportCollectionJson = async () => {
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
        const imported = ApiService.importCollectionsFromJson(text, collections);
        if (imported.length === 0) {
          alert('Nessuna nuova _collection importata: già presente nel workspace.');
          return;
        }
        onImportCollections(imported); // AGGIUNTO: aggiunge direttamente le _collection importate
        window.dispatchEvent(new Event('_collectionNameChanged'));
        alert('Collection importata con successo!');
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
            <div className="collections-list">
              <div className="sidebar-header">
                <h3>Collections</h3>
                <div style={{ position: 'relative', display: 'inline-block' }} ref={addMenuRef}>
                  <button
                    className="add-btn"
                    onClick={() => setAddMenuOpen(v => !v)}
                    title="Add or import _collection"
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
                          setIsAddingCollection(true);
                        }}
                      >
                        Create new
                      </div>
                      <div
                        style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
                        onClick={handleImportCollectionJson}
                      >
                        Import json
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isAddingCollection && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                  />
                  <div className="form-buttons">
                    <button onClick={handleAddCollection}>Add</button>
                    <button onClick={() => setIsAddingCollection(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <ul className="collections">
                {collections.map(_collection => (
                  <li key={_collection.id} className="_collection-item">
                    <div
                      className="_collection-header"
                      onClick={() => toggleCollectionExpanded(_collection.id)}
                      onContextMenu={e => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, _collection });
                      }}
                      onMouseDown={e => {
                        if (e.button === 0 && e.ctrlKey) {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, _collection });
                        }
                      }}
                    >
                      <span
                        className={`arrow ${expandedCollections[_collection.id] ? 'expanded' : ''}`}
                      >
                        ▶
                      </span>
                      {editingCollectionId === _collection.id ? (
                        <input
                          className="_collection-edit-input"
                          type="text"
                          value={editingCollectionName}
                          autoFocus
                          onChange={e => setEditingCollectionName(e.target.value)}
                          onBlur={() => {
                            if (
                              editingCollectionName.trim() &&
                              editingCollectionName !== _collection.name
                            ) {
                              // Aggiorna il nome della _collection
                              _collection.name = editingCollectionName.trim();
                              // Forza il re-render e la persistenza
                              if (typeof window !== 'undefined')
                                window.dispatchEvent(new Event('_collectionNameChanged'));
                            }
                            setEditingCollectionId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === 'Escape') {
                              setEditingCollectionId(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="_collection-name"
                          onDoubleClick={e => {
                            e.stopPropagation();
                            setEditingCollectionId(_collection.id);
                            setEditingCollectionName(_collection.name);
                          }}
                        >
                          {_collection.name}
                        </span>
                      )}
                      <button
                        className="remove-_collection-btn x-red"
                        title="Remove _collection"
                        onClick={e => {
                          e.stopPropagation();
                          onRemoveCollection(_collection.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {expandedCollections[_collection.id] && (
                      <ul className="requests-list">
                        {_collection.requests.map(request => (
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
                              title="Rimuovi dalla _collection"
                              onClick={e => {
                                e.stopPropagation();
                                onRemoveRequestFromCollection(_collection.id, request.id);
                              }}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                        {_collection.requests.length === 0 && (
                          <li className="no-items">No requests in this _collection</li>
                        )}
                      </ul>
                    )}
                  </li>
                ))}
                {collections.length === 0 && <li className="no-items">No collections</li>}
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
