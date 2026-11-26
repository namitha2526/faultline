import React, { Component, ErrorInfo, ReactNode } from "react";
import { Faultline } from "./client";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FaultlineErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    try {
      Faultline.captureException(error, {
        componentStack: errorInfo.componentStack,
      });
    } catch {
      // Faultline will never crash the app
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 m-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-sm max-w-xl mx-auto my-12">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-red-800">Something went wrong in this component</h3>
              <p className="text-sm text-red-600 mt-1 font-mono break-all">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <p className="text-xs text-red-500 mt-2">
                This error was automatically captured by Faultline.
              </p>
              <button
                onClick={this.handleRetry}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

