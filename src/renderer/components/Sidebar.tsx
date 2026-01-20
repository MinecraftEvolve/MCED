import React from "react";
import { ModList } from "./ModList";
import { useAppStore } from "@/store";

export function Sidebar() {
  const compactView = useAppStore((state) => state.settings.compactView);

  return (
    <aside
      className={`${compactView ? "w-64" : "w-80"} border-r border-primary/20 bg-gradient-to-b from-card/30 to-background flex flex-col transition-all duration-300 shadow-lg`}
    >
      <ModList />
    </aside>
  );
}
