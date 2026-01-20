import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  shortcut?: string;
  delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  shortcut,
  delayDuration = 200,
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className="z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-lg animate-in fade-in-0 zoom-in-95"
            sideOffset={5}
          >
            <div className="flex flex-col gap-1">
              <div>{content}</div>
              {shortcut && <div className="text-xs text-gray-400 font-mono">{shortcut}</div>}
            </div>
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
