
// Fix: Use standard React imports and explicit namespace references to avoid shadowing and ensure type safety
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Define interfaces for Props and State
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Fix: Use React.Component explicitly and declare state/props properties to ensure they are correctly recognized by TypeScript.
// This addresses errors where 'state' and 'props' were reported as missing on the ErrorBoundary type.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare the state and props properties to satisfy TypeScript checks on the instance.
  // This resolves errors: Property 'state' does not exist on type 'ErrorBoundary' and Property 'props' does not exist on type 'ErrorBoundary'.
  public state: ErrorBoundaryState;
  public readonly props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Correctly initialize state on the instance
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // Fix: Static method for error boundary state update
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Fix: Use React.ErrorInfo for the catch-all error handling logic
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // Fix: Access this.state safely within the render method after ensuring proper property declaration
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

    // Fix: Access this.props correctly to return children as expected for a wrapper component
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
