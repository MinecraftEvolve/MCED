import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TagDisplayProps {
  tag: string;
  instancePath: string;
  size?: number;
  onClick?: () => void;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({
  tag,
  instancePath,
  size = 48,
  onClick,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadTagItems();
  }, [tag, instancePath]);

  useEffect(() => {
    if (items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 2000); // Rotate every 2 seconds
      return () => clearInterval(interval);
    }
  }, [items.length]);

  const loadTagItems = async () => {
    try {
      setLoading(true);
      const result = await window.api.kubeJSGetTagItems(instancePath, tag);
      if (result.success && result.items && result.items.length > 0) {
        setItems(result.items);
        setCurrentIndex(0);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to load tag items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-muted border-2 border-muted rounded animate-pulse"
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <span className="text-xs text-muted-foreground">...</span>
      </div>
    );
  }

  if (items.length > 0 && items[currentIndex].texture) {
    return (
      <div
        className="relative group cursor-pointer"
        style={{ width: size, height: size }}
        onClick={onClick}
        title={`${tag} (${currentIndex + 1}/${items.length})`}
      >
        <img
          src={`data:image/png;base64,${items[currentIndex].texture}`}
          alt={items[currentIndex].id}
          className="w-full h-full pixelated"
          style={{ imageRendering: "pixelated" }}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border border-background"
          title="Tag"
        />

        {items.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrev}
              className="w-5 h-5 bg-black/70 hover:bg-black/90 rounded flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNext}
              className="w-5 h-5 bg-black/70 hover:bg-black/90 rounded flex items-center justify-center text-white"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show tag label as fallback
  return (
    <div
      className="flex items-center justify-center bg-blue-500/20 border-2 border-blue-500 rounded cursor-pointer hover:bg-blue-500/30 transition-colors"
      style={{ width: size, height: size }}
      onClick={onClick}
      title={tag}
    >
      <span className="text-xs font-mono text-blue-400 p-1 text-center break-all">
        #{tag.split(":")[1] || tag}
      </span>
    </div>
  );
};
