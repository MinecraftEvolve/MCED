import React from 'react';
import { ModList } from '../ModList/ModList';

export function Sidebar() {
  return (
    <aside className="w-80 border-r border-border bg-background flex flex-col">
      <ModList />
    </aside>
  );
}
