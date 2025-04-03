'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './pwa-utils';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker();
  }, []);

  return <>{children}</>;
} 