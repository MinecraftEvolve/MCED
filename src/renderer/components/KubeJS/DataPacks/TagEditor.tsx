import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Tag } from "lucide-react";

interface TagData {
  id: string;
  type: "items" | "blocks" | "fluids" | "entity_types";
  values: string[];
  replace?: boolean;
}

interface TagEditorProps {
  instancePath: string;
}

export const TagEditor: React.FC<TagEditorProps> = ({ instancePath }) => {
  const [tags, setTags] = useState<TagData[]>([]);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [newTagId, setNewTagId] = useState("");
  const [newTagType, setNewTagType] = useState<TagData["type"]>("items");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    loadTags();
  }, [instancePath]);

  const loadTags = async () => {
    try {
      const result = await window.api.kubeJSLoadTags(instancePath);
      if (result.success && result.data) {
        const loadedTags = result.data.map((tag: any) => ({
          id: tag.id,
          type: tag.type as TagData["type"],
          values: tag.values,
          replace: false,
        }));
        setTags(loadedTags);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const tagTypes: Array<{ value: TagData["type"]; label: string }> = [
    { value: "items", label: "Items" },
    { value: "blocks", label: "Blocks" },
    { value: "fluids", label: "Fluids" },
    { value: "entity_types", label: "Entity Types" },
  ];

  const createNewTag = () => {
    if (!newTagId.trim()) return;

    const tag: TagData = {
      id: newTagId,
      type: newTagType,
      values: [],
      replace: false,
    };

    setTags([...tags, tag]);
    setSelectedTag(tag);
    setNewTagId("");
  };

  const addValue = () => {
    if (!selectedTag || !newValue.trim()) return;

    const updatedTag = {
      ...selectedTag,
      values: [...selectedTag.values, newValue],
    };

    setTags(tags.map((t) => (t.id === selectedTag.id ? updatedTag : t)));
    setSelectedTag(updatedTag);
    setNewValue("");
  };

  const removeValue = (value: string) => {
    if (!selectedTag) return;

    const updatedTag = {
      ...selectedTag,
      values: selectedTag.values.filter((v) => v !== value),
    };

    setTags(tags.map((t) => (t.id === selectedTag.id ? updatedTag : t)));
    setSelectedTag(updatedTag);
  };

  const deleteTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
    if (selectedTag?.id === tagId) {
      setSelectedTag(null);
    }
  };

  const saveTag = async () => {
    if (!selectedTag) return;

    try {
      const result = await window.api.kubeJSSaveTag(instancePath, {
        id: selectedTag.id,
        type: selectedTag.type,
        values: selectedTag.values,
        replace: selectedTag.replace,
      });

      if (result.success) {
        console.log("Tag saved successfully to:", result.data);
        // Optionally show a success notification
      } else {
        console.error("Failed to save tag:", result.error);
      }
    } catch (error) {
      console.error("Error saving tag:", error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Tags List */}
      <div className="w-64 border-r border-primary/20 bg-secondary/20 flex flex-col">
        <div className="p-3 border-b border-primary/20">
          <div className="space-y-2">
            <input
              type="text"
              value={newTagId}
              onChange={(e) => setNewTagId(e.target.value)}
              placeholder="Tag ID (e.g., forge:ores/copper)"
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-sm text-foreground"
            />
            <select
              value={newTagType}
              onChange={(e) => setNewTagType(e.target.value as TagData["type"])}
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-sm text-foreground"
            >
              {tagTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              onClick={createNewTag}
              className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Tag
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`p-3 mb-2 rounded cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                selectedTag?.id === tag.id
                  ? "bg-primary/20 border border-primary"
                  : "bg-secondary/40 hover:bg-secondary/60 border border-primary/20"
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{tag.id}</span>
                </div>
                <span className="text-xs text-muted-foreground">{tag.type}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTag(tag.id);
                }}
                className="p-1 hover:bg-destructive/20 rounded transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Editor */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedTag ? (
          <>
            <div className="p-4 border-b border-primary/20 bg-secondary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedTag.id}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTag.type}</p>
                </div>
                <button
                  onClick={saveTag}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Tag
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedTag.replace}
                  onChange={(e) => {
                    const updated = { ...selectedTag, replace: e.target.checked };
                    setTags(tags.map((t) => (t.id === selectedTag.id ? updated : t)));
                    setSelectedTag(updated);
                  }}
                  className="rounded border-primary/20"
                />
                <label className="text-sm text-foreground">Replace existing tag values</label>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addValue()}
                    placeholder="Item/Block ID (e.g., minecraft:copper_ore)"
                    className="flex-1 px-3 py-2 bg-background border border-primary/20 rounded text-sm text-foreground"
                  />
                  <button
                    onClick={addValue}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Values ({selectedTag.values.length})
                </h4>
                {selectedTag.values.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/40 border border-primary/20 rounded"
                  >
                    <code className="text-sm text-foreground">{value}</code>
                    <button
                      onClick={() => removeValue(value)}
                      className="p-1 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
                {selectedTag.values.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No values added yet. Add items to this tag above.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a tag or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
