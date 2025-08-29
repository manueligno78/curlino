import React, { useState } from 'react';
import { ApiResponseData } from '../services/ApiService';
import { logger } from '../utils/BrowserLogger';
import { SettingsService } from '../services/SettingsService';
import { getStatusInfo, UIMessageTone } from '../utils/statusMessages';
import HeadersSection from './shared/HeadersSection';
import '../styles/ResponsePanel.css';

interface ResponsePanelProps {
  response: ApiResponseData | null;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
  const [headersCollapsed, setHeadersCollapsed] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [settingsService] = useState(() => new SettingsService());

  // Helper function to render status badge (compact version for header)
  const renderStatusBadge = (statusCode: number, status: string) => {
    try {
      const settings = settingsService.getSettings();
      const messageTone = settings.appearance?.statusMessageTone || 'friendly';
      const statusInfo = getStatusInfo(statusCode, messageTone as UIMessageTone);

      return (
        <div className={`status-badge ${getStatusClass(statusCode, status)}`}>
          <span className="status-emoji">{statusInfo.emoji}</span>
          <span className="status-code">{statusCode}</span>
        </div>
      );
    } catch (error) {
      // Fallback to simple status display if there's any error
      return (
        <div className={`status-badge ${getStatusClass(statusCode, status)}`}>
          {statusCode} {status}
        </div>
      );
    }
  };

  // Helper function to render status message separately
  const renderStatusMessage = (statusCode: number) => {
    try {
      const settings = settingsService.getSettings();
      const messageTone = settings.appearance?.statusMessageTone || 'friendly';
      const statusInfo = getStatusInfo(statusCode, messageTone as UIMessageTone);

      return (
        <div className="status-message-container">
          <span className="status-message-text">{statusInfo.message}</span>
        </div>
      );
    } catch (error) {
      // Return null if there's any error - no message shown
      return null;
    }
  };

  // If there is no response, show an empty message
  if (!response) {
    return (
      <div className="response-panel empty-response">
        <h2>Response</h2>
        <div className="no-response">Send a request to see the response</div>
      </div>
    );
  }

  // Format JSON output in a readable way
  const formatJson = (data: unknown): string => {
    try {
      if (!data || (typeof data === 'string' && data.trim() === '')) {
        return '// No data';
      }
      return JSON.stringify(data, null, 2);
    } catch (_e) {
      return String(data);
    }
  };

  // Determina la classe CSS in base allo stato HTTP
  const getStatusClass = (statusCode: number, status: string): string => {
    if (status === 'Error') return 'status-error';
    if (statusCode >= 100 && statusCode < 200) return 'status-1xx';
    if (statusCode >= 200 && statusCode < 300) return 'status-2xx';
    if (statusCode >= 300 && statusCode < 400) return 'status-3xx';
    if (statusCode >= 400 && statusCode < 500) return 'status-4xx';
    if (statusCode >= 500 && statusCode < 600) return 'status-5xx';
    return 'status-unknown';
  };

  // Copy response body to clipboard
  const copyBodyToClipboard = async () => {
    try {
      const bodyText = formatJson(response.body);
      await navigator.clipboard.writeText(bodyText);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
      logger.debug('Response body copied to clipboard', {
        component: 'ResponsePanel',
        action: 'copyBodyToClipboard',
      });
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
      logger.error('Failed to copy response body to clipboard', {
        component: 'ResponsePanel',
        action: 'copyBodyToClipboard',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="response-panel">
      {/* Response Header with Status */}
      <div className="response-header">
        <h2>Response</h2>
        <div className="response-meta">
          {response.statusCode > 0 ? (
            renderStatusBadge(response.statusCode, response.status)
          ) : (
            <div className="status-badge status-error">Error</div>
          )}
          {response.responseTime > 0 && (
            <div className="time-badge">{response.responseTime} ms</div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {response.statusCode > 0 && renderStatusMessage(response.statusCode)}

      {/* Headers Section */}
      <HeadersSection
        headers={response.headers || {}}
        isCollapsed={headersCollapsed}
        onToggleCollapse={() => setHeadersCollapsed(!headersCollapsed)}
        mode="readonly"
      />

      {/* Body Section */}
      <div className="panel-section">
        <div className="section-header">
          <h3 className="section-title">Body</h3>
          <button
            onClick={copyBodyToClipboard}
            className="btn btn-ghost btn-sm copy-btn"
            title="Copy response body to clipboard"
          >
            📋 {copySuccess || 'Copy'}
          </button>
        </div>
        <div className="body-section">
          <pre className="response-body">{formatJson(response.body)}</pre>
        </div>
      </div>
    </div>
  );
};

export default ResponsePanel;
