import React, { useState } from 'react';
import { launcherService } from '@/services/LauncherService';
import { useAppStore } from '@/store';

export function LaunchButton() {
  const { currentInstance, hasUnsavedChanges } = useAppStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    if (!currentInstance) return;

    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Launch anyway?')) {
        return;
      }
    }

    setIsLaunching(true);
    setError(null);

    try {
      const launcher = await launcherService.detectLauncher(currentInstance.path);
      
      if (!launcher) {
        setError('Could not detect launcher');
        setIsLaunching(false);
        return;
      }

      const success = await launcherService.launch(currentInstance.path, launcher.type);
      
      if (!success) {
        setError('Failed to launch Minecraft');
      }
    } catch (err: any) {
      setError(err.message || 'Launch failed');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLaunch}
        disabled={isLaunching}
        className="relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold"
      >
        {isLaunching ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Launching...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Launch Minecraft
            {hasUnsavedChanges && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </>
        )}
      </button>

      {error && (
        <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-xs text-destructive font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
