import React, { useState, useEffect, useRef } from 'react';
import { Request } from '../models/Request';
import { importCurlCommand } from '../utils/curlImporter';
import { generateCurlCommand } from '../utils/curlGenerator';
import { Collection } from '../models/Collection';
import { Environment } from '../models/Environment';
import { logger } from '../utils/BrowserLogger';
import HeadersSection from './shared/HeadersSection';
import QueryParamsSection from './shared/QueryParamsSection';
import '../styles/RequestPanel.css';

interface RequestPanelProps {
  request: Request;
  onSendRequest: (
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string
  ) => void;
  onSaveToCollection: (collectionId: string) => void;
  onImportCurl?: (request: Request) => void;
  onRequestNameChange?: (newName: string) => void;
  collections?: Collection[];
  activeEnvironment?: Environment;
}

const RequestPanel: React.FC<RequestPanelProps> = ({
  request,
  onSendRequest,
  onSaveToCollection,
  onImportCurl,
  onRequestNameChange,
  collections = [],
  activeEnvironment,
}) => {
  // State management
  const [url, setUrl] = useState(request.url);
  const [method, setMethod] = useState(request.method);
  const [body, setBody] = useState(request.body);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([]);
  const [showSaveToCollection, setShowSaveToCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [bodyType, setBodyType] = useState<'json' | 'text' | 'form' | 'none'>('json');
  const [headersCollapsed, setHeadersCollapsed] = useState<boolean>(true);
  const [queryParams, setQueryParams] = useState<
    { key: string; value: string; enabled: boolean }[]
  >([]);
  const [queryParamsCollapsed, setQueryParamsCollapsed] = useState<boolean>(true);
  const [isUpdatingFromUrl, setIsUpdatingFromUrl] = useState(false);
  const [isUpdatingFromParams, setIsUpdatingFromParams] = useState(false);
  const urlDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [curlCopySuccess, setCurlCopySuccess] = useState<string>('');

  // Helper function to check if method supports body
  const methodSupportsBody = (method: string): boolean => {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  };

  // Refs
  const urlInputRef = useRef<HTMLInputElement>(null);
  const savePopupRef = useRef<HTMLDivElement>(null);

  // Update local state when the request prop changes
  useEffect(() => {
    logger.debug('RequestPanel receiving new request prop', {
      component: 'RequestPanel',
      action: 'updateRequest',
      requestId: request.id,
      requestName: request.name,
      requestUrl: request.url,
      requestMethod: request.method,
      requestHeaders: request.headers,
      requestBody: request.body?.substring(0, 100),
    });

    setUrl(request.url || '');
    setMethod(request.method || 'GET');
    setBody(request.body || '');

    // Convert headers object to array with enabled flag
    const headerEntries = Object.entries(request.headers || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));
    setHeaders(headerEntries.length > 0 ? headerEntries : [{ key: '', value: '', enabled: true }]);

    // Extract query parameters from URL
    try {
      const urlObj = new URL(request.url || 'http://localhost');
      const queryEntries = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }));
      setQueryParams(
        queryEntries.length > 0 ? queryEntries : [{ key: '', value: '', enabled: true }]
      );
    } catch {
      // If URL parsing fails, initialize with empty query params
      setQueryParams([{ key: '', value: '', enabled: true }]);
    }

    // Clear any errors when request changes
    setError(null);

    logger.debug('RequestPanel state updated after request change', {
      component: 'RequestPanel',
      action: 'updateRequest',
      localUrl: request.url,
      localMethod: request.method,
      headersCount: headerEntries.length,
    });
  }, [request]);

  // Sync query parameters to URL when they change
  useEffect(() => {
    // Only update URL for methods that don't support body and avoid circular updates
    if (!methodSupportsBody(method) && !isUpdatingFromUrl) {
      setIsUpdatingFromParams(true);
      updateUrlWithQueryParams(queryParams);
      // Reset flag after a short delay to allow for URL state update
      setTimeout(() => setIsUpdatingFromParams(false), 50);
    }
  }, [queryParams, method, isUpdatingFromUrl]);

  // Parse query parameters from URL when URL changes manually (with debouncing)
  useEffect(() => {
    // Clear existing timer
    if (urlDebounceTimer.current) {
      clearTimeout(urlDebounceTimer.current);
    }

    // Only parse when method doesn't support body, URL changed manually, and avoid circular updates
    if (!methodSupportsBody(method) && url.trim() && !isUpdatingFromParams) {
      // Set a debounced timer to parse URL after user stops typing
      const timer = setTimeout(() => {
        // Only parse if URL contains query parameters (has '?' and '=')
        if (url.includes('?') && url.includes('=')) {
          const parsedParams = parseQueryParamsFromUrl(url);
          // Only update if the parsed params are different from current params
          const currentParamsString = JSON.stringify(
            queryParams
              .filter(q => q.key.trim() && q.enabled)
              .map(q => ({ key: q.key.trim(), value: q.value }))
          );
          const parsedParamsString = JSON.stringify(
            parsedParams
              .filter(q => q.key.trim() && q.enabled)
              .map(q => ({ key: q.key.trim(), value: q.value }))
          );

          if (currentParamsString !== parsedParamsString) {
            setIsUpdatingFromUrl(true);
            setQueryParams(parsedParams);
            // Reset flag after a short delay
            setTimeout(() => setIsUpdatingFromUrl(false), 50);
          }
        }
        urlDebounceTimer.current = null;
      }, 500); // Wait 500ms after user stops typing

      urlDebounceTimer.current = timer;
    }

    // Cleanup timer on unmount
    return () => {
      if (urlDebounceTimer.current) {
        clearTimeout(urlDebounceTimer.current);
      }
    };
  }, [url, method, isUpdatingFromParams, queryParams]);

  // Header management
  const updateHeader = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    setHeaders(prev => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const addHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const getHeadersObject = () => {
    const obj: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key.trim() && h.enabled) {
        obj[h.key.trim()] = h.value;
      }
    });
    return obj;
  };

  // Query parameters management
  const updateQueryParam = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    setQueryParams(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const addQueryParam = () => {
    setQueryParams(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(prev => prev.filter((_, i) => i !== index));
  };

  // Update URL when query parameters change
  const updateUrlWithQueryParams = (params: typeof queryParams) => {
    const enabledParams = params.filter(q => q.key.trim() && q.enabled);

    try {
      // Parse the current URL to get the base URL without query parameters
      const currentUrl = url.trim();
      const urlWithoutQuery = currentUrl.split('?')[0];

      if (enabledParams.length === 0) {
        // No query parameters, just set the base URL
        setUrl(urlWithoutQuery);
      } else {
        // Build query string
        const searchParams = new URLSearchParams();
        enabledParams.forEach(q => {
          searchParams.append(q.key.trim(), q.value);
        });
        const newUrl = `${urlWithoutQuery}?${searchParams.toString()}`;
        setUrl(newUrl);
      }
    } catch (error) {
      // If URL parsing fails, don't update the URL
      logger.debug('Failed to update URL with query parameters', {
        component: 'RequestPanel',
        action: 'updateUrlWithQueryParams',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Parse query parameters from URL
  const parseQueryParamsFromUrl = (urlString: string) => {
    try {
      // Handle relative URLs by adding a dummy base
      const fullUrl = urlString.startsWith('http')
        ? urlString
        : `http://localhost${urlString.startsWith('/') ? '' : '/'}${urlString}`;
      const urlObj = new URL(fullUrl);
      const queryEntries = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }));
      return queryEntries.length > 0 ? queryEntries : [{ key: '', value: '', enabled: true }];
    } catch {
      // If URL parsing fails, return empty query params
      return [{ key: '', value: '', enabled: true }];
    }
  };

  const getQueryString = () => {
    const params = queryParams.filter(q => q.key.trim() && q.enabled);
    if (params.length === 0) return '';

    const searchParams = new URLSearchParams();
    params.forEach(q => {
      searchParams.append(q.key.trim(), q.value);
    });
    return searchParams.toString();
  };

  // JSON formatting
  const formatJsonBody = () => {
    if (!body.trim()) {
      setError('No JSON content to format');
      return;
    }

    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      setBody(formatted);
      setError(null);
      logger.debug('JSON formatted successfully', {
        component: 'RequestPanel',
        action: 'formatJson',
      });
    } catch (err) {
      setError('Invalid JSON format - cannot format');
      logger.error('JSON format failed', {
        component: 'RequestPanel',
        action: 'formatJson',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // cURL handling
  const handleCurlImport = (curlCommand: string) => {
    try {
      const importedRequest = importCurlCommand(curlCommand);
      if (importedRequest && onImportCurl) {
        onImportCurl(importedRequest);
      }
    } catch (err) {
      setError('Invalid cURL command format');
      logger.error('cURL import failed', {
        component: 'RequestPanel',
        action: 'importCurl',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Copy cURL command to clipboard
  const copyCurlToClipboard = async () => {
    try {
      // Create a request object with current state
      const currentRequest = new Request(request.id, request.name, url);
      currentRequest.method = method;
      currentRequest.headers = getHeadersObject();
      if (methodSupportsBody(method)) {
        currentRequest.body = body;
      }

      const curlCommand = generateCurlCommand(currentRequest);
      await navigator.clipboard.writeText(curlCommand);
      setCurlCopySuccess('Copied!');
      setTimeout(() => setCurlCopySuccess(''), 2000);
      logger.debug('cURL command copied to clipboard', {
        component: 'RequestPanel',
        action: 'copyCurlToClipboard',
      });
    } catch (err) {
      setCurlCopySuccess('Failed to copy');
      setTimeout(() => setCurlCopySuccess(''), 2000);
      logger.error('Failed to copy cURL command to clipboard', {
        component: 'RequestPanel',
        action: 'copyCurlToClipboard',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Send request handler
  const handleSendRequest = async () => {
    if (!url.trim()) {
      setError('URL is required');
      urlInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if it's a cURL command
      if (url.trim().toLowerCase().startsWith('curl ')) {
        handleCurlImport(url);
        setIsLoading(false); // Fix: Reset loading state after cURL import
        return;
      }

      const headersObj = getHeadersObject();

      // Build URL with query parameters
      let finalUrl = url;
      const queryString = getQueryString();
      if (queryString) {
        const separator = url.includes('?') ? '&' : '?';
        finalUrl = `${url}${separator}${queryString}`;
      }

      // Add Content-Type for JSON body
      if (bodyType === 'json' && body.trim() && !headersObj['Content-Type']) {
        headersObj['Content-Type'] = 'application/json';
      }

      await onSendRequest(finalUrl, method, headersObj, body);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      logger.error('Request send failed', {
        component: 'RequestPanel',
        action: 'sendRequest',
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Environment variable validation
  const findUnresolvedPlaceholders = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(/\{\{(.+?)\}\}/g);
    if (!matches) return [];

    if (!activeEnvironment) return matches.map(m => m.slice(2, -2).trim());

    return matches
      .map(m => m.slice(2, -2).trim())
      .filter(varName => !activeEnvironment.getVariableValue(varName));
  };

  const unresolvedVars = [
    ...findUnresolvedPlaceholders(url),
    ...headers.flatMap(h => [
      ...findUnresolvedPlaceholders(h.key),
      ...findUnresolvedPlaceholders(h.value),
    ]),
    ...findUnresolvedPlaceholders(body),
  ];

  const hasUnresolvedVars = new Set(unresolvedVars).size > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendRequest();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [url, method, headers, body]);

  // Close save popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (savePopupRef.current && !savePopupRef.current.contains(event.target as Node)) {
        setShowSaveToCollection(false);
      }
    };

    if (showSaveToCollection) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSaveToCollection]);

  const canSend = url.trim() && !isLoading;
  const canSave = url.trim() && collections.length > 0;

  return (
    <div className="request-panel">
      {/* Request Name */}
      <div className="panel-section">
        <div>
          <input
            type="text"
            value={request.name}
            onChange={e => onRequestNameChange?.(e.target.value)}
            className="input request-name-input"
            placeholder="Untitled Request"
          />
        </div>
      </div>

      {/* URL and Method */}
      <div className="panel-section">
        <div className="url-container">
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="select method-select"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>

          <input
            ref={urlInputRef}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint or paste cURL command"
            className={`input url-input ${hasUnresolvedVars ? 'input-warning' : ''}`}
          />

          <div className="url-actions">
            <button
              onClick={handleSendRequest}
              disabled={!canSend}
              className={`btn ${isLoading ? 'btn-loading' : 'btn-primary'}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending
                </>
              ) : (
                'Send'
              )}
            </button>

            <button
              onClick={copyCurlToClipboard}
              className="btn btn-ghost"
              title="Copy as cURL command"
            >
              📋 {curlCopySuccess || 'cURL'}
            </button>

            {canSave && (
              <div className="save-dropdown" style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSaveToCollection(!showSaveToCollection)}
                  className="btn btn-secondary"
                  title="Save to collection"
                >
                  💾
                </button>

                {showSaveToCollection && (
                  <div ref={savePopupRef} className="dropdown-menu">
                    <div className="dropdown-header">Save to Collection</div>
                    <select
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}
                      className="select"
                    >
                      <option value="">Select collection...</option>
                      {collections.map(col => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                    <div className="dropdown-actions">
                      <button
                        onClick={() => {
                          if (selectedCollection) {
                            onSaveToCollection(selectedCollection);
                            setShowSaveToCollection(false);
                            setSelectedCollection('');
                          }
                        }}
                        disabled={!selectedCollection}
                        className="btn btn-primary btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowSaveToCollection(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="hint">
          💡 Press <kbd>⌘</kbd> + <kbd>Enter</kbd> to send
        </div>
      </div>

      {/* Environment Variables Warning */}
      {hasUnresolvedVars && (
        <div className="panel-section">
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div>
              <div className="warning-title">Unresolved Variables</div>
              <div className="warning-message">
                {Array.from(new Set(unresolvedVars)).join(', ')} -
                {activeEnvironment
                  ? ' not found in current environment'
                  : ' no environment selected'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="panel-section">
          <div className="error-banner">
            <span className="error-icon">❌</span>
            <div className="error-message">{error}</div>
            <button onClick={() => setError(null)} className="btn btn-ghost btn-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Headers Section */}
      <HeadersSection
        headers={headers}
        isCollapsed={headersCollapsed}
        onToggleCollapse={() => setHeadersCollapsed(!headersCollapsed)}
        mode="editable"
        onUpdateHeader={updateHeader}
        onRemoveHeader={removeHeader}
        onAddHeader={addHeader}
      />

      {/* Query Parameters Section - shown when method doesn't support body */}
      {!methodSupportsBody(method) && (
        <QueryParamsSection
          queryParams={queryParams}
          isCollapsed={queryParamsCollapsed}
          onToggleCollapse={() => setQueryParamsCollapsed(!queryParamsCollapsed)}
          onUpdateQueryParam={updateQueryParam}
          onRemoveQueryParam={removeQueryParam}
          onAddQueryParam={addQueryParam}
        />
      )}

      {/* Body Section - only shown for methods that support body */}
      {methodSupportsBody(method) && (
        <div className="panel-section">
          <h3 className="section-title">Body</h3>
          <div className="body-section">
            <div className="body-type-selector">
              {(['none', 'json', 'text', 'form'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setBodyType(type)}
                  className={`btn btn-sm ${bodyType === type ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
              {bodyType === 'json' && (
                <button
                  onClick={formatJsonBody}
                  className="btn btn-sm btn-ghost"
                  title="Format JSON"
                >
                  ✨ Format
                </button>
              )}
            </div>

            {bodyType !== 'none' && (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={
                  bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body content'
                }
                className="textarea body-editor"
                rows={8}
                aria-label="Request body content"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestPanel;
