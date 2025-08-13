import { logger } from './BrowserLogger';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: AppError) => void> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Creates a standardized error object
   */
  createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ): AppError {
    return {
      id: this.generateId(),
      type,
      message,
      originalError,
      context,
      timestamp: new Date(),
    };
  }

  private generateId(): string {
    return 'error-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Handles an error by logging it and notifying callbacks
   */
  handleError(error: AppError): void {
    // Log error using structured logging
    logger.error(error.message, {
      component: 'ErrorHandler',
      errorId: error.id,
      errorType: error.type,
      context: error.context,
      originalError: error.originalError?.message,
      stack: error.originalError?.stack,
    });

    // Notify registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        logger.error('Error in error callback', {
          component: 'ErrorHandler',
          error: callbackError instanceof Error ? callbackError.message : String(callbackError),
          stack: callbackError instanceof Error ? callbackError.stack : undefined,
        });
      }
    });
  }

  /**
   * Register a callback to be called when errors occur
   */
  onError(callback: (error: AppError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove an error callback
   */
  removeErrorCallback(callback: (error: AppError) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Wraps a function with error handling
   */
  withErrorHandling<T extends unknown[], R>(
    fn: (...args: T) => R | Promise<R>,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    context?: Record<string, unknown>
  ) {
    return async (...args: T): Promise<R | null> => {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        const appError = this.createError(
          errorType,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined,
          context
        );
        this.handleError(appError);
        return null;
      }
    };
  }

  /**
   * Convert various error types to user-friendly messages
   */
  getDisplayMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection and try again.';
      case ErrorType.VALIDATION_ERROR:
        return error.message || 'Invalid input provided.';
      case ErrorType.API_ERROR:
        return error.message || 'Server error occurred. Please try again later.';
      case ErrorType.STORAGE_ERROR:
        return 'Failed to save or load data. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();
