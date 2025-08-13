import React, { useState, useEffect } from 'react';
import { AppError, errorHandler } from '../utils/ErrorHandler';
import './ErrorNotification.css';

interface NotificationState {
  id: string;
  error: AppError;
  visible: boolean;
}

export const ErrorNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  useEffect(() => {
    const handleError = (error: AppError) => {
      const id = Date.now().toString();
      const notification: NotificationState = {
        id,
        error,
        visible: true,
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, visible: false } : n)));

        // Remove from array after animation
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 300);
      }, 5000);
    };

    errorHandler.onError(handleError);

    return () => {
      errorHandler.removeErrorCallback(handleError);
    };
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, visible: false } : n)));

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="error-notifications">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`error-notification ${notification.visible ? 'visible' : 'hidden'} error-${notification.error.type.toLowerCase()}`}
        >
          <div className="error-content">
            <div className="error-message">
              {errorHandler.getDisplayMessage(notification.error)}
            </div>
            {process.env.NODE_ENV !== 'production' && notification.error.originalError && (
              <div className="error-details">{notification.error.originalError.message}</div>
            )}
          </div>
          <button
            className="error-dismiss"
            onClick={() => dismissNotification(notification.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
