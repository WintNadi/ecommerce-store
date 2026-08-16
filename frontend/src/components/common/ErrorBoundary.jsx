import React, { Component } from 'react';
import { AlertCircle, RefreshCw, Home, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo: errorInfo,
    });

    // You can send error to your logging service here
    // logErrorToService(error, errorInfo);
  }

  // Reset error state
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    // Reload the page if needed
    if (this.props.reloadOnReset) {
      window.location.reload();
    }
  };

  // Toggle error details visibility
  toggleDetails = () => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails,
    }));
  };

  // Go back to home
  goHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      // Custom fallback UI if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI with Navy + Orange color scheme
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4 transition-colors duration-200">
          <div className="max-w-lg w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
              {/* Header */}
              <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                      Something went wrong
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      We apologize for the inconvenience
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {error?.message || 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>

                {/* Show error details (for development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4">
                    <button
                      onClick={this.toggleDetails}
                      className="text-sm text-navy-600 dark:text-navy-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                    {showDetails && errorInfo && (
                      <div className="mt-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-48">
                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                  <button
                    onClick={this.goHome}
                    className="flex items-center gap-2 px-4 py-2 bg-navy-500 hover:bg-navy-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </button>
                  {this.props.onRetry && (
                    <button
                      onClick={this.props.onRetry}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/30 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If this issue persists, please contact support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;