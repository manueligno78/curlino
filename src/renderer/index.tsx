import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Hide loading screen when React app starts
const hideLoading = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
};

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide loading after React renders
setTimeout(hideLoading, 100);
