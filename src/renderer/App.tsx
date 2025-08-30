// filepath: /Users/manuel/curlino/src/renderer/App.tsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import RequestPanel from '../components/RequestPanel';
import ResponsePanel from '../components/ResponsePanel';
import TabSystem from '../components/TabSystem';
import HistoryPanel from '../components/HistoryPanel';
import { SettingsModal } from '../components/SettingsModal';
import ImportPanel from '../components/ImportPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorNotification } from '../components/ErrorNotification';
import { ApiService, ApiResponseData } from '../services/ApiService';
import { StorageService } from '../services/StorageService';
import { SettingsService } from '../services/SettingsService';
import { Group } from '../models/Group';
import { Environment } from '../models/Environment';
import { Request } from '../models/Request';
import { importCurlCommand } from '../utils/curlImporter';
import { generateUUID } from '../utils/formatters';
import { logger } from '../utils/BrowserLogger';
import { AxiosRequestConfig } from 'axios';
import './App.css';
import '../styles/components.css';
import '../styles/RequestPanel.css';
import '../styles/ResponsePanel.css';
import '../styles/SettingsModal.css';

// Create service instances
const apiService = new ApiService();
const storageService = new StorageService();
const settingsService = new SettingsService();

interface Tab {
  id: string;
  title: string;
  request: Request;
  response?: ApiResponseData | null;
}

const App: React.FC = () => {
  // State for groups and environments
  const [groups, setGroups] = useState<Group[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | undefined>();

  // State for tabs and active request
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // State for last request (per generare curl)
  const [_lastRequest, __setLastRequest] = useState<AxiosRequestConfig | undefined>(undefined);

  // State for active view
  const [activeView, setActiveView] = useState<'import' | 'builder' | 'history' | 'settings'>(
    'import'
  );

  // State for theme
  const [darkTheme, setDarkTheme] = useState<boolean>(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [environmentsLoaded, setEnvironmentsLoaded] = useState(false);

  // Stato per larghezza pannello request
  const [_requestPanelWidth, _setRequestPanelWidth] = useState(520);

  // Load data on mount
  useEffect(() => {
    // Load groups and environments from storage
    const savedGroups = storageService.loadGroups();
    logger.debug('Groups loaded at startup', {
      component: 'App',
      action: 'loadGroups',
      count: savedGroups.length,
    });
    const savedEnvironments = storageService.loadEnvironments();
    const activeEnvId = storageService.loadActiveEnvironmentId();

    // Inizializza e carica le impostazioni
    const settings = settingsService.getSettings();
    setDarkTheme(settings.theme.isDark);
    settingsService.applyCurrentTheme();

    setGroups(savedGroups);
    setEnvironments(savedEnvironments);
    setGroupsLoaded(true);
    setEnvironmentsLoaded(true);

    if (activeEnvId) {
      const env = savedEnvironments.find(e => e.id === activeEnvId);
      if (env) {
        setActiveEnvironment(env);
        apiService.setActiveEnvironment(env);
      }
    }

    // Create a default tab if none exists
    if (savedGroups.length > 0 && savedGroups[0].requests.length > 0) {
      const firstRequest = savedGroups[0].requests[0];
      createNewTab(firstRequest);
    } else {
      // Create an empty request
      const emptyRequest = new Request('new-' + generateUUID(), 'New Request', '');
      createNewTab(emptyRequest);
    }
  }, []);

  // Save groups ONLY after first load
  useEffect(() => {
    if (groupsLoaded) {
      logger.debug('Groups updated', {
        component: 'App',
        action: 'updateGroups',
        count: groups.length,
      });
      storageService.saveGroups(groups);
    }
  }, [groups, groupsLoaded]);

  // Save environments ONLY after first load
  useEffect(() => {
    if (environmentsLoaded) {
      storageService.saveEnvironments(environments);
    }
  }, [environments, environmentsLoaded]);

  useEffect(() => {
    if (activeEnvironment) {
      storageService.saveActiveEnvironment(activeEnvironment.id);
      apiService.setActiveEnvironment(activeEnvironment);
    } else {
      storageService.saveActiveEnvironment(null);
      apiService.setActiveEnvironment(undefined);
    }
  }, [activeEnvironment]);

  // Create a new tab with the given request
  const createNewTab = (request: Request) => {
    const newTab = {
      id: 'tab-' + generateUUID(),
      title: request.name || 'New Request',
      request: request,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  };

  // Ottieni il tab attivo
  const getActiveTab = (): Tab | undefined => {
    if (!activeTabId) return undefined;
    return tabs.find(tab => tab.id === activeTabId);
  };

  // Ottieni la request attiva
  const getActiveRequest = (): Request | undefined => {
    return getActiveTab()?.request;
  };

  // Ottieni la response attiva
  const getActiveResponse = (): ApiResponseData | null => {
    return getActiveTab()?.response || null;
  };

  // Handle sending a request
  const handleSendRequest = async (
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string
  ) => {
    const activeRequest = getActiveRequest();
    if (activeRequest && activeTabId) {
      activeRequest.url = url;
      activeRequest.method = method;
      activeRequest.headers = headers;
      activeRequest.body = body;

      // Crea la configurazione della richiesta per Axios
      const requestConfig = {
        url,
        method,
        headers,
        data: method !== 'GET' ? body : undefined,
      };

      __setLastRequest(requestConfig);

      try {
        const apiResponse = await apiService.sendRequest(requestConfig);
        // Salva la response solo nel tab attivo
        setTabs(prevTabs =>
          prevTabs.map(tab => (tab.id === activeTabId ? { ...tab, response: apiResponse } : tab))
        );
      } catch (error) {
        setTabs(prevTabs =>
          prevTabs.map(tab =>
            tab.id === activeTabId
              ? {
                  ...tab,
                  response: {
                    status: 'Unhandled error',
                    statusCode: 0,
                    headers: {},
                    body: {
                      error: error instanceof Error ? error.message : String(error),
                    },
                    responseTime: 0,
                  },
                }
              : tab
          )
        );
      }
    }
  };

  // Handle environment selection
  const handleEnvironmentChange = (environmentId: string | null) => {
    if (environmentId) {
      const env = environments.find(e => e.id === environmentId);
      setActiveEnvironment(env);
    } else {
      setActiveEnvironment(undefined);
    }
  };

  // Aggiorna un ambiente esistente
  const handleUpdateEnvironment = (updatedEnvironment: Environment) => {
    setEnvironments(prevEnvironments => {
      return prevEnvironments.map(env =>
        env.id === updatedEnvironment.id ? updatedEnvironment : env
      );
    });

    // Se stiamo aggiornando l'ambiente attivo, aggiorna anche quello
    if (activeEnvironment?.id === updatedEnvironment.id) {
      setActiveEnvironment(updatedEnvironment);
    }
  };

  // Handle cURL import
  const handleImportRequest = (curlCommand: string) => {
    // Gestisco il cambio di vista per il pulsante Import
    if (curlCommand === '__VIEW_CHANGE__') {
      setActiveView('import');
      return;
    }

    logger.debug('Importing cURL command from header', {
      component: 'App',
      action: 'handleImportRequest',
      curlCommand: curlCommand.substring(0, 100),
    });

    const importedRequest = importCurlCommand(curlCommand);

    if (importedRequest) {
      logger.debug('Successfully parsed cURL command', {
        component: 'App',
        action: 'handleImportRequest',
        importedRequest: {
          id: importedRequest.id,
          name: importedRequest.name,
          url: importedRequest.url,
          method: importedRequest.method,
        },
      });

      // Create a new tab with the imported request
      createNewTab(importedRequest);
      // Torna alla vista builder dopo l'importazione
      setActiveView('builder');
    } else {
      logger.error('Failed to parse cURL command', {
        component: 'App',
        action: 'handleImportRequest',
        curlCommand: curlCommand.substring(0, 100),
      });
    }
  };

  // Toggle view handlers
  const toggleHistoryView = () => {
    // Se già attiva, disattiva
    if (activeView === 'history') {
      setActiveView('builder');
    } else {
      setActiveView('history');
    }
  };

  const activateBuilderView = () => {
    setActiveView('builder');

    // Se non ci sono tab, crea un tab di default
    if (tabs.length === 0) {
      const emptyRequest = new Request('new-' + generateUUID(), 'New Request', '');
      createNewTab(emptyRequest);
    }
  };

  // Handle selecting a request from history
  const handleHistoryRequestSelect = (request: Request) => {
    createNewTab(request);
    setActiveView('builder');
  };

  // Toggle theme between light and dark
  const handleThemeToggle = () => {
    const newTheme = darkTheme ? 'light' : 'dark';
    setDarkTheme(!darkTheme);

    // Usa il servizio delle impostazioni per cambiare tema
    settingsService.setTheme(newTheme);
  };

  // Toggle settings view
  const toggleSettingsView = () => {
    // Se già attiva, disattiva
    if (activeView === 'settings') {
      setActiveView('builder');
    } else {
      setActiveView('settings');
    }
  };

  // Aggiorna il nome della request e il titolo del tab attivo
  const handleRequestNameChange = (newName: string) => {
    if (!activeTabId) return;
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          // Aggiorna la proprietà name dell'oggetto request esistente
          tab.request.name = newName;
          return { ...tab, title: newName };
        }
        return tab;
      })
    );
  };

  // Gestione evento custom per forzare la persistenza e il re-render dopo rinomina group
  useEffect(() => {
    const handler = () => {
      setGroups(groups => [...groups]); // forza re-render e triggera useEffect di persistenza
    };
    window.addEventListener('groupNameChanged', handler);
    return () => window.removeEventListener('groupNameChanged', handler);
  }, []);

  // Gestione evento custom per forzare la persistenza e il re-render dopo rinomina environment
  useEffect(() => {
    const handler = () => {
      setEnvironments(envs => [...envs]); // forza re-render e triggera useEffect di persistenza
    };
    window.addEventListener('environmentNameChanged', handler);
    return () => window.removeEventListener('environmentNameChanged', handler);
  }, []);

  // Determine which panel to show based on active view
  const renderActivePanel = () => {
    const activeRequest = getActiveRequest();
    switch (activeView) {
      case 'history':
        return (
          <div className="full-width-panel">
            <HistoryPanel onSelectRequest={handleHistoryRequestSelect} />
          </div>
        );
      case 'import':
        return (
          <div className="full-width-panel">
            <ImportPanel onImport={handleImportRequest} />
          </div>
        );
      case 'settings':
        return null; // Settings now handled by modal
      case 'builder':
      default:
        return (
          <>
            <TabSystem
              tabs={tabs}
              activeTabId={activeTabId}
              onTabChange={tabId => {
                setActiveTabId(tabId);
                if (activeView !== 'builder') {
                  setActiveView('builder');
                }
              }}
              onNewTab={() => {
                const emptyRequest = new Request('new-' + generateUUID(), 'New Request', '');
                createNewTab(emptyRequest);
                setActiveView('builder');
              }}
              onTabClose={tabId => {
                setTabs(tabs.filter(tab => tab.id !== tabId));
                if (activeTabId === tabId && tabs.length > 1) {
                  setActiveTabId(tabs[0].id);
                }
              }}
            />
            <div className="builder-vertical-panels">
              <div className="builder-request-panel">
                {activeRequest ? (
                  <RequestPanel
                    request={activeRequest}
                    onSendRequest={handleSendRequest}
                    onSaveToGroup={groupId => {
                      setGroups(prev =>
                        prev.map(col => {
                          if (col.id === groupId) {
                            col.addRequest(activeRequest);
                          }
                          return col;
                        })
                      );
                    }}
                    onImportCurl={importedRequest => {
                      // Create a new tab with the imported request
                      createNewTab(importedRequest);
                    }}
                    onRequestNameChange={handleRequestNameChange}
                    groups={groups}
                    activeEnvironment={activeEnvironment}
                  />
                ) : (
                  <div className="empty-request-panel">
                    <p>Seleziona una richiesta o crea una nuova</p>
                  </div>
                )}
                <div className="panel-resize-handle" title="Drag to resize panels"></div>
              </div>
              <div className="builder-response-panel">
                <ResponsePanel response={getActiveResponse()} />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <ErrorNotification />
        <Header
          onImportRequest={handleImportRequest}
          onToggleHistory={toggleHistoryView}
          onActivateBuilder={activateBuilderView}
          onThemeToggle={handleThemeToggle}
          darkTheme={darkTheme}
          onSettingsToggle={toggleSettingsView}
          activeView={activeView}
        />
        <div className="main-content">
          <ErrorBoundary>
            <Sidebar
              groups={groups}
              environments={environments}
              activeEnvironment={activeEnvironment}
              onEnvironmentChange={handleEnvironmentChange}
              onRequestSelect={request => {
                createNewTab(request);
                setActiveView('builder');
              }}
              onNewGroup={name => {
                const newGroup = new Group('col-' + generateUUID(), name);
                setGroups([...groups, newGroup]);
              }}
              onNewEnvironment={name => {
                const newEnvironment = new Environment('env-' + generateUUID(), name);
                setEnvironments([...environments, newEnvironment]);
              }}
              onRemoveGroup={groupId => {
                setGroups(groups.filter(col => col.id !== groupId));
              }}
              onRemoveRequestFromGroup={(groupId, requestId) => {
                setGroups(
                  groups.map(col => {
                    if (col.id === groupId) {
                      col.removeRequest(requestId);
                    }
                    return col;
                  })
                );
              }}
              onRemoveEnvironment={environmentId => {
                setEnvironments(environments.filter(env => env.id !== environmentId));
                if (activeEnvironment?.id === environmentId) {
                  setActiveEnvironment(undefined);
                }
              }}
              onImportGroups={imported => {
                setGroups([...groups, ...imported]);
              }}
              onUpdateEnvironment={handleUpdateEnvironment}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="content-area">{renderActivePanel()}</div>
          </ErrorBoundary>
        </div>
        <SettingsModal
          isOpen={activeView === 'settings'}
          onClose={() => setActiveView('builder')}
          environments={environments}
          activeEnvironment={activeEnvironment}
          onEnvironmentChange={handleEnvironmentChange}
          onNewEnvironment={name => {
            const newEnvironment = new Environment('env-' + generateUUID(), name);
            setEnvironments([...environments, newEnvironment]);
          }}
          onRemoveEnvironment={environmentId => {
            setEnvironments(environments.filter(env => env.id !== environmentId));
            if (activeEnvironment?.id === environmentId) {
              setActiveEnvironment(undefined);
            }
          }}
          onUpdateEnvironment={handleUpdateEnvironment}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
