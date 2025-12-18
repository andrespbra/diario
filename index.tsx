
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fallback polyfill
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

// Define interfaces for Props and State to resolve 'state' and 'props' property existence errors
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Use property initializer for state to avoid constructor-related TypeScript inference issues
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  // Correctly type the static method to return ErrorBoundaryState
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Use ErrorInfo type for componentDidCatch
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // Correctly check this.state.hasError after proper typing
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Algo deu errado.</h1>
          <p style={{ marginBottom: '20px', color: '#666' }}>A aplicação encontrou um erro inesperado.</p>
          <pre style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', overflow: 'auto', maxWidth: '90%', textAlign: 'left', fontSize: '12px', border: '1px solid #e5e7eb' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              background: '#4F46E5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Return children prop or null to satisfy return type and resolve potential missing children error
    return this.props.children || null;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
