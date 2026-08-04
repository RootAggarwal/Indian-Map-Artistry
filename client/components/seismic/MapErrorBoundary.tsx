"use client"

import React from "react"

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class MapErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <p className="text-sm font-medium">Map failed to load</p>
            <p className="text-xs opacity-60">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 rounded bg-ochre/20 px-3 py-1.5 text-xs font-medium text-ochre hover:bg-ochre/30"
            >
              Reload map
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
