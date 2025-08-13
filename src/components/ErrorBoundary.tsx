import React, { Component, ReactNode } from 'react';
import { ErrorType, errorHandler } from '../utils/ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = errorHandler.createError(ErrorType.UNKNOWN_ERROR, error.message, error, {
      componentStack: errorInfo.componentStack,
    });
    errorHandler.handleError(appError);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>An error occurred while rendering this component.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="error-retry-button"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
