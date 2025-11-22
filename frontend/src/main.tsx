import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DarkModeProvider } from './contexts/DarkModeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

