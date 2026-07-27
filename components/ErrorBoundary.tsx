"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Terjadi kesalahan pada dashboard</h2>
          <p className="text-[--on-surface-variant] mb-4">Mohon maaf, kami tidak dapat memuat data saat ini.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[--primary] text-white rounded-lg"
          >
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
