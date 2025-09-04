'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h2>
            <p className="text-gray-300 mb-4">The application encountered an error. Please try refreshing the page.</p>
            <details className="text-sm text-gray-400">
              <summary className="cursor-pointer hover:text-gray-200">Error details</summary>
              <pre className="mt-2 overflow-auto">{this.state.error?.toString()}</pre>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;