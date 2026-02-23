import React, { useState } from "react";
import { ModList } from "./ModList";
import { useAppStore } from "@/store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar() {
  const compactView = useAppStore((state) => state.settings.compactView);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${isCollapsed ? "w-12" : compactView ? "w-64" : "w-80"} border-r border-primary/20 bg-gradient-to-b from-card/30 to-background flex flex-col transition-all duration-300 shadow-lg relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-10 p-1 bg-card border border-primary/30 rounded-full shadow-md hover:bg-primary/10 transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
      {!isCollapsed && <ModList />}
    </aside>
  );
}
