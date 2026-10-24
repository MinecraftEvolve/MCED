import React from "react";
import { ModInfo } from "@shared/types/mod.types";
import { useSettingsStore } from "@/store/settingsStore";
import { useUpdateStore } from "@/store/updateStore";

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
  const getUpdate = useUpdateStore((s) => s.getUpdate);
  const hasUpdate = !!getUpdate(mod.modId);

  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer rounded-xl border transition-all duration-200
        ${isCompact ? "mx-2 my-1 p-2" : "mx-2 my-1.5 p-3"}
        ${
          isSelected
            ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20 scale-[1.01]"
            : "border-transparent bg-card/30 hover:border-primary/30 hover:bg-card/60 hover:shadow-md hover:scale-[1.01]"
        }
      `}
    >
      <div className={`flex items-center ${isCompact ? "gap-2" : "gap-3"}`}>
        {mod.icon ? (
          <img
            src={mod.icon}
            alt={mod.name}
            className={`flex-shrink-0 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-110 ${isCompact ? "h-8 w-8" : "h-10 w-10"}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}

        <div
          className={`hidden rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 text-center font-bold text-primary shadow-md transition-transform duration-200 group-hover:scale-110 ${
            isCompact ? "flex h-8 w-8 items-center justify-center text-xs" : "flex h-10 w-10 items-center justify-center text-sm"
          }`}
        >
          {mod.name.substring(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className={`truncate font-semibold transition-colors duration-200 ${
                isCompact ? "text-xs" : "text-sm"
              } ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}
            >
              {mod.name}
            </h3>
            {hasUpdate && (
              <span
                className="inline-flex flex-shrink-0 items-center rounded-full border border-orange-500/40 bg-orange-500/20 px-1.5 py-0.5 font-semibold leading-none text-orange-400"
                style={{ fontSize: "9px" }}
                title={`Update available: ${getUpdate(mod.modId)?.latestVersion}`}
              >
                Update
              </span>
            )}
          </div>
          {!isCompact && <p className="truncate text-xs text-muted-foreground">v{mod.version}</p>}
        </div>

        {isSelected && (
          <div
            className={`rounded-full bg-primary shadow-lg shadow-primary/50 ${isCompact ? "h-2.5 w-2.5" : "h-3 w-3"}`}
          />
        )}
      </div>
    </div>
  );
});
