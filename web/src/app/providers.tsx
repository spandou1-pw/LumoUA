'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerServiceWorker } from '../native/bridge';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker(); // doc: Offline Cache / PWA — same registration path for web and the Tauri webview
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
