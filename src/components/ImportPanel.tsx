import React, { useState } from 'react';
import './ImportPanel.css';

interface ImportPanelProps {
  onImport: (url: string) => void;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ onImport }) => {
  const [importUrl, setImportUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    const curlCommand = importUrl.trim();
    if (!curlCommand) {
      setError('Please enter a valid cURL command');
      return;
    }

    if (!curlCommand.toLowerCase().startsWith('curl')) {
      setError('The command must start with "curl"');
      return;
    }

    setError(null);
    onImport(curlCommand);
    setImportUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleImport();
    }
  };

  return (
    <div className="import-panel">
      <div className="import-panel-header">
        <h2>Import Request</h2>
      </div>

      <div className="import-panel-content">
        <div className="import-instruction">
          <p>Paste a cURL command below to import it as a request</p>
        </div>

        <div className="curl-input-area">
          <textarea
            value={importUrl}
            onChange={e => setImportUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="curl https://example.com -H 'Content-Type: application/json'"
            className="curl-textarea"
            rows={10}
          />
          {error && <div className="import-error">{error}</div>}

          <div className="import-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setImportUrl('')}
              disabled={!importUrl}
            >
              Clear
            </button>
            <button className="btn btn-primary" onClick={handleImport} disabled={!importUrl.trim()}>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPanel;
