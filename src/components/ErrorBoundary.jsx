import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">發生錯誤</h1>
            <p className="text-gray-500 mb-6">應用程式遇到了非預期的錯誤。</p>
            
            <div className="bg-gray-50 p-4 rounded text-left text-xs font-mono text-red-600 overflow-auto max-h-40 mb-6 border border-gray-200 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>

            <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  重新載入
                </button>
                <button 
                  onClick={() => {
                      localStorage.removeItem('gh_token');
                      window.location.reload();
                  }} 
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  清除登入
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
