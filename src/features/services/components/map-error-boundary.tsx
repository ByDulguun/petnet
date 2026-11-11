"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches runtime failures from the live Google Maps SDK (invalid/expired
 * key, quota exceeded, a script load failure, a marker-rendering crash like
 * the SDK's own "Cannot read properties of undefined (reading
 * 'getRootNode')" error under a bad key) that would otherwise propagate
 * past this component entirely and hit the route's top-level error
 * boundary, replacing the whole /map page with a generic error screen.
 *
 * React error boundaries only catch errors during render/commit, not ones
 * thrown asynchronously — but the Maps SDK's marker-mount failures do throw
 * synchronously from a `useEffect`, which React treats as a render-phase
 * error for boundary purposes, so this reliably catches them.
 */
export class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: (retry: () => void) => ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Server-side logging only — never surfaced to the user, matching the
    // rest of the app's error-handling convention (see src/lib/api-handler.ts).
    console.error("[map]", error);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return this.props.fallback(this.retry);
    return this.props.children;
  }
}
