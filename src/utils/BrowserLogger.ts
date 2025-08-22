// Browser-compatible logger for client-side logging
// This avoids the winston dependency issues in browser environments

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class BrowserLogger {
  private static instance: BrowserLogger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  public static getInstance(): BrowserLogger {
    if (!BrowserLogger.instance) {
      BrowserLogger.instance = new BrowserLogger();
    }
    return BrowserLogger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `${timestamp} [${level.toUpperCase()}]`;

    if (context?.component) {
      formattedMessage += ` [${context.component}]`;
    }

    formattedMessage += `: ${message}`;

    if (context && Object.keys(context).length > 0) {
      const contextData = { ...context };
      delete contextData.component; // Already included in message
      if (Object.keys(contextData).length > 0) {
        formattedMessage += ` ${JSON.stringify(contextData)}`;
      }
    }

    return formattedMessage;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  public error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Convenience methods for common logging patterns
  public apiRequest(method: string, url: string, statusCode?: number, responseTime?: number): void {
    this.info('API Request', {
      component: 'ApiService',
      action: 'request',
      method,
      url,
      statusCode,
      responseTime,
    });
  }

  public apiError(method: string, url: string, error: Error | string, context?: LogContext): void {
    this.error('API Request Failed', {
      component: 'ApiService',
      action: 'request_error',
      method,
      url,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }

  public storageOperation(operation: string, key: string, success: boolean, error?: Error): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = success
      ? `Storage operation successful: ${operation}`
      : `Storage operation failed: ${operation}`;

    this.log(level, message, {
      component: 'StorageService',
      action: operation,
      key,
      success,
      error: error?.message,
      stack: error?.stack,
    });
  }

  public userAction(action: string, context?: LogContext): void {
    this.info('User Action', {
      component: 'UI',
      action,
      ...context,
    });
  }

  // Method to change log level at runtime
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('Log level changed', { newLevel: level });
  }

  // Get current log level
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
export const logger = BrowserLogger.getInstance();
export default logger;

// Make logger available globally for runtime log level changes
if (typeof window !== 'undefined') {
  (window as typeof window & { logger: BrowserLogger }).logger = logger;
}
