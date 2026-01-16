import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Save, AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ScriptValidator } from '../ScriptValidator';

interface CodeEditorProps {
  filePath: string;
  fileName: string;
  scriptType: 'server' | 'client' | 'startup';
  instancePath: string;
  hasProbeJS: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  filePath,
  fileName,
  scriptType,
  instancePath,
  hasProbeJS,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }>>([]);
  const [isValid, setIsValid] = useState(true);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    loadScript();
  }, [filePath]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadScript = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.kubeJSReadScript(filePath);
      if (result.success && result.data) {
        setCode(result.data);
        setIsDirty(false);
      } else {
        setError(result.error || 'Failed to load script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveScript = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await window.api.kubeJSWriteScript(filePath, code);
      if (result.success) {
        setIsDirty(false);
        if (onSave) onSave();
      } else {
        setError(result.error || 'Failed to save script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      setIsDirty(true);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Save monaco reference globally
    if (typeof window !== 'undefined') {
      (window as any).monaco = monaco;
    }

    // Configure Monaco editor
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
    });

    // Add Ctrl+S keyboard shortcut
    try {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (isDirty) {
          saveScript();
        }
      });
    } catch (err) {
      console.warn('Failed to add keyboard shortcut:', err);
    }
  };

  const handleValidationChange = (valid: boolean, errors: typeof validationErrors) => {
    setIsValid(valid);
    setValidationErrors(errors);
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading script...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[1200px] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{fileName}</h3>
              {isDirty && <span className="text-xs text-orange-400">• Modified</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {scriptType}_scripts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isValid && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.filter(e => e.severity === 'error').length} error(s)
            </span>
          )}
          
          <button
            onClick={saveScript}
            disabled={saving || !isDirty}
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-secondary rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ProbeJS Warning */}
      {!hasProbeJS && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-blue-300 font-medium">ProbeJS Not Detected</p>
            <p className="text-xs text-blue-400">
              Install ProbeJS and run <code className="px-1 py-0.5 bg-blue-500/20 rounded text-xs">/probejs dump</code> in singleplayer for autocomplete.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Editor */}
      <div className="min-h-[900px] relative">
        <Editor
          height="900px"
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: false,
            domReadOnly: false,
          }}
        />
      </div>

      {/* Validation Sidebar */}
      {validationErrors.length > 0 && (
        <div className="h-32 border-t border-border bg-muted/50 overflow-auto">
          <div className="p-3">
            <h4 className="text-xs font-semibold mb-2 text-foreground flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Issues ({validationErrors.length})
            </h4>
            <div className="space-y-1.5">
              {validationErrors.map((err, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded text-xs cursor-pointer hover:bg-accent transition-colors ${
                    err.severity === 'error' ? 'bg-destructive/10 border-l-2 border-destructive' : 'bg-yellow-500/10 border-l-2 border-yellow-500'
                  }`}
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.revealLineInCenter(err.line);
                      editorRef.current.setPosition({ lineNumber: err.line, column: err.column });
                      editorRef.current.focus();
                    }
                  }}
                >
                  <div className="flex items-start gap-1.5">
                    {err.severity === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={err.severity === 'error' ? 'text-destructive' : 'text-yellow-500'}>
                        Line {err.line}:{err.column}
                      </p>
                      <p className="text-muted-foreground">{err.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Validator */}
      <div className="hidden">
        <ScriptValidator code={code} onValidationChange={handleValidationChange} />
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="px-4 py-1.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Ctrl+S: Save</span>
          <span>Ctrl+F: Find</span>
          <span>Ctrl+H: Replace</span>
        </div>
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-green-500">No errors</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="text-destructive">Has errors</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
