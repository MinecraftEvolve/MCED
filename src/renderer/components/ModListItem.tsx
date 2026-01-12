import React from "react";
import { ModInfo } from "@shared/types/mod.types";
import { useSettingsStore } from "@/store/settingsStore";

interface ModListItemProps {
  mod: ModInfo;
  isSelected: boolean;
  onClick: () => void;
}

export const ModListItem = React.memo(function ModListItem({
  mod,
  isSelected,
  onClick,
}: ModListItemProps) {
  const { settings } = useSettingsStore();
  const isCompact = settings.compactMode;

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer transition-all duration-200 group
        ${isCompact ? "p-2" : "p-3"}
        ${
          isSelected
            ? "bg-primary/20 border-l-2 border-primary shadow-sm"
            : "hover:bg-accent/30 border-l-2 border-transparent hover:border-primary/50"
        }
      `}
    >
      <div className={`flex items-center ${isCompact ? "gap-2" : "gap-3"}`}>
        {mod.icon ? (
          <img
            src={mod.icon}
            alt={mod.name}
            className={`rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0 ${isCompact ? "w-8 h-8" : "w-10 h-10"}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary font-bold shadow-md group-hover:scale-110 transition-transform flex-shrink-0 ${isCompact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"} ${mod.icon ? "hidden" : ""}`}
        >
          {mod.name.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold truncate group-hover:text-primary transition-colors ${isCompact ? "text-xs" : "text-sm"}`}
          >
            {mod.name}
          </h3>
          {!isCompact && (
            <p className="text-xs text-muted-foreground truncate">
              v{mod.version}
            </p>
          )}
        </div>

        {isSelected && (
          <div
            className={`rounded-full bg-primary animate-pulse ${isCompact ? "w-1.5 h-1.5" : "w-2 h-2"}`}
          ></div>
        )}
      </div>
    </div>
  );
});
