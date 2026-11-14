import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last line of defence: show a readable message instead of a blank page if rendering or storage fails. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" role="alert">
        <h1>Something went wrong</h1>
        <p className="error">{this.state.error.message}</p>
        <p className="muted">
          Your data is still stored in this browser. Reloading usually fixes this. If it keeps happening, check that the
          browser allows site storage (private windows often do not).
        </p>
        <button type="button" className="primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
