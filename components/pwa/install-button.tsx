'use client';

import { useInstallPrompt } from '@/app/pwa-utils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function InstallPWA() {
  const { installPrompt, promptInstall } = useInstallPrompt();

  if (!installPrompt) {
    return null;
  }

  return (
    <Button 
      onClick={promptInstall} 
      variant="outline" 
      className="gap-2"
    >
      <Download size={16} />
      Install App
    </Button>
  );
} 