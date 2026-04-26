import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI render failed:", error, errorInfo);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl shadow-red-100/60">
            <h2 className="text-lg font-semibold text-slate-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The page hit a render error. Check the browser console for the
              full stack trace.
            </p>
            {error?.message && (
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-white">
                {error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
