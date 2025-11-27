'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function PWALifecycle() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                toast.info('New version available!', {
                  description: 'Refresh to get the latest updates',
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                  },
                  duration: 10000,
                });
              }
            });
          }
        });
      });

      // Listen for online/offline events
      window.addEventListener('online', () => {
        toast.success('Back online!', {
          description: 'Your connection has been restored',
        });
      });

      window.addEventListener('offline', () => {
        toast.warning('You are offline', {
          description: 'Some features may be limited',
        });
      });
    }

    // Check if app is running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('Running as PWA');
    }

    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  return null;
}
