import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      let isQuotaError = false;

      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.includes('Quota limit exceeded')) {
          isQuotaError = true;
          errorMessage = "Firebase Quota Exceeded. The free daily read/write limit for this database has been reached. The quota will reset tomorrow.";
        } else if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        if (errorMessage.includes('Quota limit exceeded') || errorMessage.includes('Quota exceeded')) {
          isQuotaError = true;
          errorMessage = "Firebase Quota Exceeded. The free daily read/write limit for this database has been reached. The quota will reset tomorrow.";
        }
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4">
              {isQuotaError ? 'Quota Exceeded' : 'Application Error'}
            </h1>
            <p className="text-neutral-400 mb-8 font-medium">
              {errorMessage}
            </p>
            {isQuotaError && (
              <p className="text-sm text-neutral-500 mb-8">
                Detailed quota information can be found under the Spark plan column in the Enterprise edition section of <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noreferrer" className="text-accent hover:underline">Firebase Pricing</a>.
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
