import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/Toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DarkModeProvider>
        <AuthProvider>
          {/*
            Opt in to the v7 behaviours now. Both are already how this app
            expects routing to work, and enabling them keeps the console clear
            of upgrade warnings so real errors stay visible.
          */}
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <App />
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
