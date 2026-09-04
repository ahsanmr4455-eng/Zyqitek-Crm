import React, { StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConnectionManager } from './lib/connection';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    if (ConnectionManager.isWebSocketError(error)) {
      console.warn("[REACT RUNTIME] Ignored WebSocket/connection error in ErrorBoundary:", error);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (ConnectionManager.isWebSocketError(error)) {
      console.warn("[REACT RUNTIME] Intercepted non-fatal WebSocket error:", error, errorInfo);
      return;
    }
    console.error("[REACT RUNTIME ERROR] Caught by ErrorBoundary:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '96px', fontWeight: 700, margin: '0 0 16px', color: '#3f3f46', letterSpacing: '-0.05em' }}>404</h1>
          <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>The page you have entered does not exist</p>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
