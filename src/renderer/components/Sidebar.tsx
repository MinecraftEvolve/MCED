import React from "react";
import { ModList } from "./ModList";
import { useAppStore } from "@/store";

export function Sidebar() {
  const compactView = useAppStore((state) => state.settings.compactView);

  return (
    <aside
      className={`${compactView ? "w-64" : "w-80"} border-r border-border bg-background flex flex-col transition-all duration-300`}
    >
      <ModList />
    </aside>
  );
}
