'use client';

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

// Add a custom type for window with workbox
declare global {
  interface Window {
    workbox: any;
  }
}

// Check if service workers are supported
export function isPWASupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'workbox' in window;
}

// Register service worker
export function registerServiceWorker() {
  if (!isPWASupported()) return;
  
  const wb = new Workbox('/sw.js');
  
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      window.location.reload();
    }
  });
  
  wb.register();
}

// Hook to detect online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook to detect installation status
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    // Reset the installPrompt - it can only be used once
    setInstallPrompt(null);
    
    return result.outcome === 'accepted';
  };

  return { installPrompt, promptInstall };
} 