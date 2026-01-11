import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setHasChanges(e.target.value !== content);
  };

  const handleSave = () => {
    onSave(editedContent);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setEditedContent(content);
    setHasChanges(false);
  };

  return (
    <div className="raw-editor">
      <div className="raw-editor-header">
        <div className="header-left">
          <h3>Raw Editor</h3>
          <span className="file-path">{filePath}</span>
        </div>
        <div className="header-actions">
          {hasChanges && (
            <>
              <button onClick={handleDiscard} className="btn-discard">
                Discard Changes
              </button>
              <button onClick={handleSave} className="btn-save">
                Save Changes
              </button>
            </>
          )}
          <button onClick={onCancel} className="btn-close">
            ✕ Close
          </button>
        </div>
      </div>

      <textarea
        className="raw-editor-textarea"
        value={editedContent}
        onChange={handleChange}
        spellCheck={false}
      />

      <div className="raw-editor-footer">
        <span className="line-count">Lines: {editedContent.split('\n').length}</span>
        <span className="char-count">Characters: {editedContent.length}</span>
        {hasChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>
    </div>
  );
}
