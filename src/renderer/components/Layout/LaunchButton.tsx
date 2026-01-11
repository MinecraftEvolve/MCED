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
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {isLaunching ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Launching...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Launch Minecraft
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
