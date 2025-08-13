import { ErrorHandler, ErrorType } from '../../src/utils/ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    mockCallback = jest.fn();
    // Clear any existing callbacks
    errorHandler['errorCallbacks'] = [];
  });

  it('should be a singleton', () => {
    const instance1 = ErrorHandler.getInstance();
    const instance2 = ErrorHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create an error with all properties', () => {
    const originalError = new Error('Original error');
    const context = { userId: '123', action: 'test' };

    const error = errorHandler.createError(
      ErrorType.NETWORK_ERROR,
      'Test error message',
      originalError,
      context
    );

    expect(error.type).toBe(ErrorType.NETWORK_ERROR);
    expect(error.message).toBe('Test error message');
    expect(error.originalError).toBe(originalError);
    expect(error.context).toBe(context);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should handle errors and notify callbacks', () => {
    errorHandler.onError(mockCallback);

    const error = errorHandler.createError(ErrorType.VALIDATION_ERROR, 'Validation failed');

    errorHandler.handleError(error);

    expect(mockCallback).toHaveBeenCalledWith(error);
  });

  it('should remove error callbacks', () => {
    errorHandler.onError(mockCallback);
    errorHandler.removeErrorCallback(mockCallback);

    const error = errorHandler.createError(ErrorType.API_ERROR, 'API error');
    errorHandler.handleError(error);

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should wrap functions with error handling', async () => {
    const testFunction = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    const wrappedFunction = errorHandler.withErrorHandling(testFunction, ErrorType.UNKNOWN_ERROR, {
      context: 'test',
    });

    const result = await wrappedFunction();

    expect(result).toBeNull();
    expect(testFunction).toHaveBeenCalled();
  });

  it('should return result when wrapped function succeeds', async () => {
    const testFunction = jest.fn().mockReturnValue('success');

    const wrappedFunction = errorHandler.withErrorHandling(testFunction);
    const result = await wrappedFunction();

    expect(result).toBe('success');
  });

  it('should provide user-friendly display messages', () => {
    const networkError = errorHandler.createError(ErrorType.NETWORK_ERROR, 'Network failed');
    const validationError = errorHandler.createError(ErrorType.VALIDATION_ERROR, 'Invalid input');
    const apiError = errorHandler.createError(ErrorType.API_ERROR, 'Server error');
    const storageError = errorHandler.createError(ErrorType.STORAGE_ERROR, 'Storage failed');
    const unknownError = errorHandler.createError(ErrorType.UNKNOWN_ERROR, 'Unknown');

    expect(errorHandler.getDisplayMessage(networkError)).toContain('Network connection error');
    expect(errorHandler.getDisplayMessage(validationError)).toBe('Invalid input');
    expect(errorHandler.getDisplayMessage(apiError)).toBe('Server error');
    expect(errorHandler.getDisplayMessage(storageError)).toContain('Failed to save or load data');
    expect(errorHandler.getDisplayMessage(unknownError)).toContain('unexpected error');
  });
});
