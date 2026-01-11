import React from 'react';
import { ModInfo } from '@shared/types/mod.types';
import { ConfigEditor } from '../ConfigEditor/ConfigEditor';
import { useAppStore } from '@/store';

interface ModCardProps {
  mod: ModInfo;
}

export function ModCard({ mod }: ModCardProps) {
  const { currentInstance } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Mod Header */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex items-start gap-4">
          {mod.icon ? (
            <img
              src={mod.icon}
              alt={mod.name}
              className="w-16 h-16 rounded"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center text-muted-foreground text-2xl font-bold">
              {mod.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{mod.name}</h2>
            <p className="text-muted-foreground">
              v{mod.version}
              {mod.authors && mod.authors.length > 0 && (
                <> • by {mod.authors.join(', ')}</>
              )}
            </p>
          </div>
        </div>

        {mod.description && (
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {mod.description}
          </p>
        )}

        {/* Links */}
        {(mod.homepage || mod.sources || mod.issueTracker) && (
          <div className="flex gap-2 mt-4">
            {mod.homepage && (
              <a
                href={mod.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                Homepage
              </a>
            )}
            {mod.sources && (
              <a
                href={mod.sources}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                Source Code
              </a>
            )}
            {mod.issueTracker && (
              <a
                href={mod.issueTracker}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                Issues
              </a>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <h3 className="font-semibold mb-3">Details</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Mod ID:</dt>
            <dd className="font-mono">{mod.modId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version:</dt>
            <dd>{mod.version}</dd>
          </div>
          {mod.license && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">License:</dt>
              <dd>{mod.license}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Config Editor */}
      {currentInstance && (
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="font-semibold mb-4">Configuration</h3>
          <ConfigEditor 
            modId={mod.modId} 
            instancePath={currentInstance.path} 
          />
        </div>
      )}
    </div>
  );
}
