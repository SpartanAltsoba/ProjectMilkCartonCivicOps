import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to your error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="civic-alert civic-alert--emergency">
          <div className="glass-panel">
            <h2 className="text-xl font-black text-black mb-4">Something went wrong</h2>
            <div className="space-y-4">
              <p className="text-black font-bold">
                We apologize for the inconvenience. Please try refreshing the page or contact
                support if the problem persists.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-4">
                  <details className="text-sm">
                    <summary className="text-black font-bold cursor-pointer">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 p-4 bg-black/5 rounded-md overflow-auto text-black">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}
              <div className="mt-6">
                <button onClick={() => window.location.reload()} className="glass-button">
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
