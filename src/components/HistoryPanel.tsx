import React, { useState, useEffect, useCallback } from 'react';
import { HistoryEntry } from '../models/History';
import { HistoryService } from '../services/HistoryService';
import { Request } from '../models/Request';
import './HistoryPanel.css';

interface HistoryPanelProps {
  onSelectRequest: (request: Request) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectRequest }) => {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyService] = useState<HistoryService>(new HistoryService());
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const loadHistory = useCallback(() => {
    const entries = historyService.getHistory();
    setHistoryEntries(entries);
  }, [historyService]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      loadHistory();
    } else {
      const filteredEntries = historyService.searchHistory(searchQuery);
      setHistoryEntries(filteredEntries);
    }
  };

  const handleMethodFilterChange = (method: string) => {
    setMethodFilter(method);
    let entries = historyService.getHistory();

    // Filtra per metodo HTTP se non è "ALL"
    if (method !== 'ALL') {
      entries = entries.filter(entry => entry.request.method.toUpperCase() === method);
    }

    // Applica anche il filtro di ricerca se presente
    if (searchQuery.trim() !== '') {
      entries = entries.filter(
        entry =>
          entry.request.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.request.method.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setHistoryEntries(entries);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      historyService.clearHistory();
      setHistoryEntries([]);
    }
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita la selezione della richiesta
    historyService.deleteHistoryEntry(id);
    loadHistory();
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const getStatusCodeClass = (status: number): string => {
    if (status >= 100 && status < 200) return 'status-1xx';
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500 && status < 600) return 'status-5xx';
    return 'status-unknown';
  };

  // Filtra le voci in base al metodo HTTP selezionato
  const filteredEntries =
    methodFilter === 'ALL'
      ? historyEntries
      : historyEntries.filter(entry => entry.request.method.toUpperCase() === methodFilter);

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>History</h2>
        <div className="history-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          <button className="clear-button" onClick={handleClearHistory}>
            Clear history
          </button>
        </div>
        <div className="method-filters">
          <button
            className={`method-filter ${methodFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => handleMethodFilterChange('ALL')}
          >
            ALL
          </button>
          <button
            className={`method-filter ${methodFilter === 'GET' ? 'active' : ''}`}
            data-method="GET"
            onClick={() => handleMethodFilterChange('GET')}
          >
            GET
          </button>
          <button
            className={`method-filter ${methodFilter === 'POST' ? 'active' : ''}`}
            data-method="POST"
            onClick={() => handleMethodFilterChange('POST')}
          >
            POST
          </button>
          <button
            className={`method-filter ${methodFilter === 'PUT' ? 'active' : ''}`}
            data-method="PUT"
            onClick={() => handleMethodFilterChange('PUT')}
          >
            PUT
          </button>
          <button
            className={`method-filter ${methodFilter === 'DELETE' ? 'active' : ''}`}
            data-method="DELETE"
            onClick={() => handleMethodFilterChange('DELETE')}
          >
            DELETE
          </button>
          <button
            className={`method-filter ${methodFilter === 'PATCH' ? 'active' : ''}`}
            data-method="PATCH"
            onClick={() => handleMethodFilterChange('PATCH')}
          >
            PATCH
          </button>
        </div>
      </div>

      <div className="history-list">
        {filteredEntries.length === 0 ? (
          <div className="empty-history">No requests in history</div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="history-item"
              onClick={() => onSelectRequest(entry.request)}
            >
              <div className="history-item-header">
                <span className={`method ${entry.request.method.toLowerCase()}`}>
                  {entry.request.method}
                </span>
                <span className="url">{entry.request.url}</span>
                {entry.response && (
                  <span className={`status ${getStatusCodeClass(entry.response.status)}`}>
                    {entry.response.status}
                  </span>
                )}
                <button
                  className="delete-button"
                  onClick={e => handleDeleteEntry(entry.id, e)}
                  title="Delete entry"
                >
                  ×
                </button>
              </div>
              <div className="history-item-details">
                <span className="timestamp">{formatDate(entry.timestamp)}</span>
                {entry.response && <span className="response-time">{entry.response.time} ms</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
