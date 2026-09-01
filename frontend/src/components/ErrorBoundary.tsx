import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="grid min-h-[100dvh] place-items-center bg-sand-50 px-4 dark:bg-[#0b0f0e]">
        <div className="w-full max-w-md rounded-3xl border border-ink/[0.07] bg-white p-7 text-center shadow-card dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-[15px] text-ink-muted dark:text-sand-400">
            The page ran into an unexpected problem. Reloading usually fixes it.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-red-50 p-3 text-left text-[11px] text-red-800 dark:bg-red-500/10 dark:text-red-300">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
