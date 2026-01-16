import React, { useState } from 'react';
import { FolderOpen, FileCode, Download, Upload, Archive, AlertCircle, HelpCircle, Edit } from 'lucide-react';
import { CodeEditor } from './ScriptEditor/CodeEditor';

interface ScriptFile {
  name: string;
  path: string;
  type: 'server' | 'client' | 'startup';
  size: number;
  modified: Date;
}

interface ScriptOrganizerProps {
  instancePath: string;
  scripts: ScriptFile[];
  hasProbeJS: boolean;
  onRefresh: () => void;
}

export const ScriptOrganizer: React.FC<ScriptOrganizerProps> = ({ 
  instancePath, 
  scripts,
  hasProbeJS,
  onRefresh 
}) => {
  const [organizing, setOrganizing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [editingScript, setEditingScript] = useState<ScriptFile | null>(null);

  const organizeScripts = async () => {
    setOrganizing(true);
    try {
      const result = await window.api.kubeJSOrganizeScripts(instancePath);
      if (result.success) {
        alert(`Scripts organized successfully!\nBackup saved to: ${result.data?.backupPath || 'unknown'}`);
        onRefresh();
      } else {
        alert(`Failed to organize scripts: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to organize scripts:', error);
      alert(`Error: ${error}`);
    } finally {
      setOrganizing(false);
    }
  };

  const createBackup = async () => {
    setBackingUp(true);
    try {
      const result = await window.api.kubeJSBackupScripts(instancePath);
      if (result.success && result.data) {
        alert(`Backup created: ${result.data.backupPath}`);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setBackingUp(false);
    }
  };

  const exportScripts = async () => {
    try {
      await window.api.kubeJSExportScripts(instancePath);
    } catch (error) {
      console.error('Failed to export scripts:', error);
    }
  };

  const importScripts = async () => {
    try {
      await window.api.kubeJSImportScripts(instancePath);
      onRefresh();
    } catch (error) {
      console.error('Failed to import scripts:', error);
    }
  };

  const groupedScripts = {
    server: scripts.filter(s => s.type === 'server'),
    client: scripts.filter(s => s.type === 'client'),
    startup: scripts.filter(s => s.type === 'startup')
  };

  const handleEditScript = (script: ScriptFile) => {
    setEditingScript(script);
  };

  const handleCloseEditor = () => {
    setEditingScript(null);
  };

  const handleSaveScript = () => {
    onRefresh();
  };

  // Show editor if a script is being edited
  if (editingScript) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="flex justify-center py-4">
          <div className="w-full max-w-4xl">
            <CodeEditor
              filePath={editingScript.path}
              fileName={editingScript.name}
              scriptType={editingScript.type}
              instancePath={instancePath}
              hasProbeJS={hasProbeJS}
              onClose={handleCloseEditor}
              onSave={handleSaveScript}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Script Organizer</h2>
            <p className="text-muted-foreground">Organize and manage your KubeJS scripts</p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Script Organization
            </h3>
        
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm flex items-center gap-2 transition-colors text-foreground disabled:opacity-50"
            onClick={createBackup}
            disabled={backingUp}
          >
            <Archive className="w-4 h-4" />
            {backingUp ? 'Creating Backup...' : 'Backup'}
          </button>
          
          <button
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm flex items-center gap-2 transition-colors text-foreground"
            onClick={exportScripts}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm flex items-center gap-2 transition-colors text-foreground"
            onClick={importScripts}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          
          <button
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50 group relative"
            onClick={organizeScripts}
            disabled={organizing}
            title="Groups recipes by mod/type, removes duplicates, adds comments, and creates backup"
          >
            <FolderOpen className="w-4 h-4" />
            {organizing ? 'Organizing...' : 'Auto-Organize'}
            <HelpCircle className="w-3 h-3 opacity-50" />
          </button>
        </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4 h-full">
            {(['server', 'client', 'startup'] as const).map(type => (
              <div key={type} className="border rounded-lg p-4 bg-muted/30 flex flex-col">
                <h4 className="font-semibold capitalize mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {type}_scripts ({groupedScripts[type].length})
                </h4>
            
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {groupedScripts[type].length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  No scripts found
                </div>
              ) : (
                groupedScripts[type].map(script => (
                  <div
                    key={script.path}
                    className="text-sm p-2 rounded bg-background hover:bg-accent transition-colors cursor-pointer group"
                    onClick={() => handleEditScript(script)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" title={script.name}>
                          {script.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(script.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Edit className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
        </div>
      </div>
      </div>
    </div>
  );
};
