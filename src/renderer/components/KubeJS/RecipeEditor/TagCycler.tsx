import React, { useState, useEffect, useRef } from "react";
import { Tag } from "lucide-react";

interface TagCyclerProps {
  tagId: string;
  instancePath: string;
}

export const TagCycler: React.FC<TagCyclerProps> = ({ tagId, instancePath }) => {
  const [tagItems, setTagItems] = useState<any[]>([]);
  const [cycleIdx, setCycleIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.api.itemRegistryGetItemsByTag(instancePath, tagId).then((res) => {
      if (res.success && res.data.length > 0) setTagItems(res.data);
    });
  }, [tagId, instancePath]);

  useEffect(() => {
    if (tagItems.length <= 1) return;
    timerRef.current = setInterval(() => setCycleIdx((i) => (i + 1) % tagItems.length), 1500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tagItems.length]);

  const current = tagItems[cycleIdx];
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {current?.texture ? (
        <img
          src={
            current.texture.startsWith("data:")
              ? current.texture
              : `data:image/png;base64,${current.texture}`
          }
          alt={current.name}
          className="w-full h-full object-contain pixelated"
          title={`${tagId} → ${current.name}`}
        />
      ) : (
        <Tag className="w-5 h-5 text-muted-foreground opacity-60" />
      )}
      <div className="absolute -top-1 -left-1 bg-purple-600 text-white text-[8px] font-bold px-0.5 rounded leading-tight z-10">
        #
      </div>
    </div>
  );
};
