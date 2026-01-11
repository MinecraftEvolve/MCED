import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './RawEditor.css';

interface RawEditorProps {
  filePath: string;
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function RawEditor({ filePath, content, onSave, onCancel }: RawEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setEditedContent(newValue);
    setHasChanges(newValue !== content);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      onSave(value);
      setHasChanges(false);
    }
  };

  const handleDiscard = () => {
    setEditedContent(content);
    setHasChanges(false);
    if (editorRef.current) {
      editorRef.current.setValue(content);
    }
  };

  // Determine language based on file extension
  const getLanguage = () => {
    if (filePath.endsWith('.toml')) return 'ini';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.cfg')) return 'ini';
    if (filePath.endsWith('.properties')) return 'properties';
    return 'plaintext';
  };

  return (
    <div className="raw-editor">
      <div className="raw-editor-header">
        <div className="header-left">
          <h3>📝 Raw Editor</h3>
          <span className="file-path">{filePath}</span>
        </div>
        <div className="header-actions">
          {hasChanges && (
            <>
              <button onClick={handleDiscard} className="btn-discard">
                ↩ Discard
              </button>
              <button onClick={handleSave} className="btn-save">
                💾 Save
              </button>
            </>
          )}
          <button onClick={onCancel} className="btn-close">
            ✕ Close
          </button>
        </div>
      </div>

      <div className="raw-editor-container">
        <Editor
          height="100%"
          defaultLanguage={getLanguage()}
          value={editedContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            folding: true,
            renderWhitespace: 'selection',
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      <div className="raw-editor-footer">
        <span className="line-count">Lines: {editedContent.split('\n').length}</span>
        <span className="char-count">Characters: {editedContent.length}</span>
        {hasChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>
    </div>
  );
}
