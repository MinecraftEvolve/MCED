import React, { useState } from "react";
import { ModList } from "./ModList";
import { useAppStore } from "@/store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar() {
  const compactView = useAppStore((state) => state.settings.compactView);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${isCollapsed ? "w-12" : compactView ? "w-64" : "w-80"} flex flex-col border-r border-primary/20 bg-gradient-to-b from-card/30 to-background shadow-lg transition-all duration-300`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-primary/30 bg-card shadow-md transition-all hover:border-purple-500/40 hover:bg-purple-500/10"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="mx-auto h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="mx-auto h-3 w-3 text-muted-foreground" />
        )}
      </button>
      {!isCollapsed && <ModList />}
    </aside>
  );
}
