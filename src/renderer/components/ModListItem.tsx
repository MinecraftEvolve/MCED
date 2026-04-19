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
        cursor-pointer transition-all duration-200 group
        ${isCompact ? "p-2 mx-2 my-1" : "p-3 mx-2 my-1.5"}
        rounded-xl
        ${
          isSelected
            ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02]"
            : "bg-card/30 hover:bg-card/60 border-2 border-transparent hover:border-primary/30 hover:scale-[1.02] hover:shadow-md"
        }
      `}
    >
      <div className={`flex items-center ${isCompact ? "gap-2" : "gap-3"}`}>
        {mod.icon ? (
          <img
            src={mod.icon}
            alt={mod.name}
            className={`rounded-xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0 ${isCompact ? "w-8 h-8" : "w-10 h-10"}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-primary font-bold shadow-md group-hover:scale-110 transition-transform flex-shrink-0 ${isCompact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"} ${mod.icon ? "hidden" : ""}`}
        >
          {mod.name.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              className={`font-semibold truncate group-hover:text-primary transition-colors ${isCompact ? "text-xs" : "text-sm"}`}
            >
              {mod.name}
            </h3>
            {hasUpdate && (
              <span
                className="flex-shrink-0 inline-flex items-center rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-semibold leading-none"
                style={{ fontSize: "9px", padding: "2px 5px" }}
                title={`Update available: ${getUpdate(mod.modId)?.latestVersion}`}
              >
                Update
              </span>
            )}
          </div>
          {!isCompact && <p className="text-xs text-muted-foreground truncate">v{mod.version}</p>}
        </div>

        {isSelected && (
          <div
            className={`rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50 ${isCompact ? "w-2 h-2" : "w-2.5 h-2.5"}`}
          ></div>
        )}
      </div>
    </div>
  );
});
