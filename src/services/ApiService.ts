import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { Environment } from '../models/Environment';
import { Request } from '../models/Request';
import { HistoryService } from './HistoryService';
import { SettingsService } from './SettingsService';
import { generateUUID } from '../utils/formatters';
import { Group } from '../models/Group';
import { ErrorType, errorHandler } from '../utils/ErrorHandler';
import { logger } from '../utils/BrowserLogger';

import { ApiResponseBody } from '../types/api';

export interface ApiResponseData {
  status: string;
  statusCode: number;
  headers: Record<string, string>;
  body: ApiResponseBody;
  responseTime: number;
}

export class ApiService {
  private activeEnvironment?: Environment;
  private historyService: HistoryService;
  private settingsService: SettingsService;

  constructor() {
    this.historyService = new HistoryService();
    this.settingsService = new SettingsService();
  }

  setActiveEnvironment(env: Environment | undefined): void {
    this.activeEnvironment = env;
  }

  getActiveEnvironment(): Environment | undefined {
    return this.activeEnvironment;
  }

  private replaceEnvironmentVariables(text: string): string {
    if (!this.activeEnvironment || !text) return text;

    return text.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
      const variable = this.activeEnvironment?.getVariableValue(varName.trim());
      return variable || match;
    });
  }

  private processConfig(config: AxiosRequestConfig): AxiosRequestConfig {
    const processedConfig = { ...config };

    // Applica le impostazioni di default
    const settings = this.settingsService.getSettings();
    const { followRedirects, timeout, sslVerification, defaultHeaders } = settings.requestDefaults;

    processedConfig.timeout = processedConfig.timeout || timeout;
    processedConfig.maxRedirects = followRedirects ? 5 : 0; // 5 è un valore comune per il numero massimo di redirect

    // Configurazioni per evitare problemi CORS
    processedConfig.withCredentials = false;

    // Applica le intestazioni predefinite se non sono già definite
    if (defaultHeaders) {
      processedConfig.headers = {
        ...defaultHeaders,
        ...(processedConfig.headers || {}),
      };
    }

    // Rimuovi intestazioni non sicure che causerebbero errori
    this.removeUnsafeHeaders(processedConfig.headers as Record<string, string>);

    if (!sslVerification) {
      logger.debug('SSL verification disabled in settings', {
        component: 'ApiService',
        action: 'processConfig',
      });
      // Nota: in un'app Electron sarebbe possibile configurare httpsAgent
      // ma lo omettiamo qui per compatibilità browser/Electron
    }

    // Se non c'è un ambiente attivo, ritorniamo la configurazione con le impostazioni di default
    if (!this.activeEnvironment) return processedConfig;

    // Replace variables in URL
    if (processedConfig.url) {
      processedConfig.url = this.replaceEnvironmentVariables(processedConfig.url);
    }

    // Replace variables in headers
    if (processedConfig.headers) {
      const processedHeaders: Record<string, string | number | boolean> = {};

      Object.entries(processedConfig.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          processedHeaders[key] = this.replaceEnvironmentVariables(value);
        } else {
          processedHeaders[key] = value;
        }
      });

      processedConfig.headers = processedHeaders;
    }

    // Replace variables in body if it's a string
    if (typeof processedConfig.data === 'string') {
      processedConfig.data = this.replaceEnvironmentVariables(processedConfig.data);
    }

    return processedConfig;
  }

  public async sendRequest(config: AxiosRequestConfig): Promise<ApiResponseData> {
    const startTime = Date.now();
    const processedConfig = this.processConfig(config);

    try {
      // Check if we're in Electron environment and use IPC for HTTP requests
      if (window.electron?.httpRequest) {
        const requestData = {
          url: processedConfig.url,
          method: processedConfig.method?.toUpperCase() || 'GET',
          headers: processedConfig.headers || {},
          body:
            typeof processedConfig.data === 'string'
              ? processedConfig.data
              : processedConfig.data
                ? JSON.stringify(processedConfig.data)
                : undefined,
          timeout: processedConfig.timeout || 30000,
          rejectUnauthorized: true, // Default to secure
        };

        // Apply SSL settings from app settings
        const settings = this.settingsService.getSettings();
        if (!settings.requestDefaults.sslVerification) {
          requestData.rejectUnauthorized = false;
        }

        const result = await window.electron.httpRequest(requestData);

        if (!result.success) {
          throw new Error(result.error?.error || 'Network request failed');
        }

        const response = result.data;

        // Log request and response to history
        const requestObj = new Request(
          generateUUID(),
          `${processedConfig.method || 'GET'} ${processedConfig.url || ''}`,
          processedConfig.url || '',
          (processedConfig.method as string) || 'GET',
          (processedConfig.headers as Record<string, string>) || {},
          typeof processedConfig.data === 'string'
            ? processedConfig.data
            : processedConfig.data
              ? JSON.stringify(processedConfig.data)
              : '',
          ''
        );

        this.historyService.addToHistory(requestObj, {
          status: response.statusCode,
          statusText: response.status,
          headers: response.headers as Record<string, string>,
          data: response.body,
          time: response.responseTime,
        });

        return {
          status: response.status,
          statusCode: response.statusCode,
          headers: response.headers as Record<string, string>,
          body: response.body,
          responseTime: response.responseTime,
        };
      }

      // Fallback to axios for web environments
      const response = await axios(processedConfig);
      const endTime = Date.now();

      // Log request and response to history
      const requestObj = new Request(
        generateUUID(), // ID univoco
        `${processedConfig.method || 'GET'} ${processedConfig.url || ''}`,
        processedConfig.url || '',
        (processedConfig.method as string) || 'GET',
        (processedConfig.headers as Record<string, string>) || {},
        typeof processedConfig.data === 'string'
          ? processedConfig.data
          : processedConfig.data
            ? JSON.stringify(processedConfig.data)
            : '',
        ''
      );

      this.historyService.addToHistory(requestObj, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        time: endTime - startTime,
      });

      return {
        status: response.statusText,
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: response.data,
        responseTime: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();
      const axiosError = error as AxiosError;

      // Create structured error
      const appError = errorHandler.createError(
        ErrorType.NETWORK_ERROR,
        this.getErrorMessage(axiosError),
        axiosError,
        {
          url: processedConfig.url,
          method: processedConfig.method,
          responseTime: endTime - startTime,
        }
      );

      // Handle error through central handler
      errorHandler.handleError(appError);

      // Log the error to history even if it's a network error
      const requestObj = new Request(
        generateUUID(),
        `${processedConfig.method || 'GET'} ${processedConfig.url || ''}`,
        processedConfig.url || '',
        (processedConfig.method as string) || 'GET',
        (processedConfig.headers as Record<string, string>) || {},
        typeof processedConfig.data === 'string'
          ? processedConfig.data
          : processedConfig.data
            ? JSON.stringify(processedConfig.data)
            : '',
        ''
      );

      // Se abbiamo una risposta dal server, restituisci i dati della risposta
      if (axiosError.response) {
        this.historyService.addToHistory(requestObj, {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          headers: axiosError.response.headers as Record<string, string>,
          data: axiosError.response.data as ApiResponseBody,
          time: endTime - startTime,
        });

        return {
          status: axiosError.response.statusText,
          statusCode: axiosError.response.status,
          headers: axiosError.response.headers as Record<string, string>,
          body: axiosError.response.data as ApiResponseBody,
          responseTime: endTime - startTime,
        };
      }

      // In case of network error without response, create an error response
      const errorMessage = this.getErrorMessage(axiosError);

      this.historyService.addToHistory(requestObj, {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: errorMessage },
        time: endTime - startTime,
      });

      return {
        status: 'Error',
        statusCode: 0,
        headers: {},
        body: { error: errorMessage },
        responseTime: endTime - startTime,
      };
    }
  }

  /**
   * Extracts a descriptive error message from an Axios error
   * @param error The error from which to extract the message
   * @returns Formatted error message
   */
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return 'Unable to connect to server. Please check the URL and try again.';
      } else if (error.code === 'ENOTFOUND') {
        return 'Host not found. Please verify the URL is correct.';
      } else if (error.code === 'ERR_BAD_REQUEST') {
        return 'Bad request. Please verify the parameters sent.';
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        return 'Timeout della richiesta. Il server non ha risposto in tempo.';
      } else if (error.message && error.message.includes('Network Error')) {
        return 'Network error. Please check your internet connection.';
      }

      return error.message || 'An error occurred during the request.';
    }

    return 'An unexpected error occurred.';
  }

  /**
   * Rimuove intestazioni HTTP non sicure che non possono essere impostate da JavaScript
   * Queste intestazioni sono riservate al browser e causano errori se si tenta di impostarle
   * @param headers Intestazioni da sanitizzare
   */
  private removeUnsafeHeaders(headers: Record<string, string> | undefined): void {
    if (!headers) return;

    // Lista delle intestazioni più problematiche che causano errori
    // Questa è una lista ridotta rispetto alla precedente, per consentire più flessibilità
    const unsafeHeaders = [
      'host',
      'connection',
      'content-length', // Questo viene calcolato automaticamente
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
    ];

    // Rimuovi solo le intestazioni assolutamente non sicure
    unsafeHeaders.forEach(header => {
      const lowerCaseHeader = header.toLowerCase();

      // Cerca le chiavi che corrispondono indipendentemente dalla maiuscola/minuscola
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase() === lowerCaseHeader) {
          logger.debug('Removing unsafe header', {
            component: 'ApiService',
            action: 'removeUnsafeHeaders',
            header: key,
          });
          delete headers[key];
        }
      });
    });
  }

  /**
   * Esporta le group in formato JSON
   * @param groups Array di Group
   * @returns stringa JSON
   */
  static exportGroupsToJson(groups: Group[]): string {
    // Serializza ogni group e le sue richieste
    const data = groups.map(col => ({
      id: col.id,
      name: col.name,
      description: col.description || '',
      requests: col.requests.map((req: Request) => ({
        id: req.id,
        name: req.name,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        description: req.description || '',
      })),
    }));
    return JSON.stringify({ groups: data }, null, 2);
  }

  /**
   * Importa una o più group da un file JSON esportato
   * @param json stringa JSON
   * @param existingGroups array di Group già presenti
   * @returns array di nuove Group importate (esclude quelle già presenti)
   * @throws Error se il formato non è valido
   */
  static importGroupsFromJson(json: string, existingGroups: Group[]): Group[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Il file non è un JSON valido.');
    }
    const parsedData = parsed as { groups?: unknown };
    if (!parsedData.groups || !Array.isArray(parsedData.groups)) {
      throw new Error('Formato non valido: manca la chiave "groups".');
    }
    const existingIds = new Set(existingGroups.map(c => c.id));
    const imported: Group[] = [];
    for (const col of parsedData.groups) {
      if (existingIds.has(col.id)) continue; // Salta se già presente
      const group = new Group(col.id, col.name, col.description || '');
      if (Array.isArray(col.requests)) {
        for (const req of col.requests) {
          group.addRequest(
            new Request(
              req.id,
              req.name,
              req.url,
              req.method,
              req.headers,
              req.body,
              req.description || ''
            )
          );
        }
      }
      imported.push(group);
    }
    return imported;
  }
}
