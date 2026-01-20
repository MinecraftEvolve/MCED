import React from "react";
import { Droplet, Plus, X } from "lucide-react";

interface Fluid {
  id: string;
  name: string;
  texture?: string;
}

interface FluidSlotProps {
  fluid: Fluid | string | null;
  size?: "small" | "normal" | "large" | "md" | "lg";
  onClick?: () => void;
  onClear?: () => void;
  amount?: number;
  onAmountChange?: (amount: number) => void;
  allowAmount?: boolean;
}

export const FluidSlot: React.FC<FluidSlotProps> = ({
  fluid,
  size = "normal",
  onClick,
  onClear,
  amount,
  onAmountChange,
  allowAmount = false,
}) => {
  // Normalize fluid to always be a Fluid object or null
  const normalizedFluid: Fluid | null = fluid
    ? typeof fluid === "string"
      ? { id: fluid, name: fluid }
      : fluid
    : null;
  const sizeClasses = {
    small: "w-12 h-12",
    normal: "w-16 h-16",
    large: "w-24 h-24",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }[size];

  const iconSize = {
    small: "w-6 h-6",
    normal: "w-8 h-8",
    large: "w-12 h-12",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  const plusSize = {
    small: "w-4 h-4",
    normal: "w-6 h-6",
    large: "w-8 h-8",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  const clearSize = {
    small: "w-4 h-4",
    normal: "w-5 h-5",
    large: "w-6 h-6",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  const padding = {
    small: "p-1.5",
    normal: "p-2",
    large: "p-3",
    md: "p-2",
    lg: "p-3",
  }[size];

  return (
    <div
      className={`relative ${sizeClasses} bg-secondary border-2 border-primary/30 rounded ${onClick ? "cursor-pointer hover:border-primary" : ""} transition-colors group`}
      onClick={onClick}
      title={
        normalizedFluid ? `${normalizedFluid.name}\n${normalizedFluid.id}` : "Click to select fluid"
      }
    >
      {normalizedFluid ? (
        <>
          <div className={`absolute inset-0 flex items-center justify-center ${padding}`}>
            {normalizedFluid.texture ? (
              <img
                src={
                  normalizedFluid.texture.startsWith("data:")
                    ? normalizedFluid.texture
                    : `data:image/png;base64,${normalizedFluid.texture}`
                }
                alt={normalizedFluid.name}
                className="w-full h-full pixelated"
                style={{
                  objectFit: "cover",
                  objectPosition: "top",
                  imageRendering: "pixelated",
                }}
              />
            ) : (
              <div className="w-full h-full bg-blue-500/20 rounded flex items-center justify-center">
                <Droplet className={`${iconSize} text-blue-400`} />
              </div>
            )}
          </div>

          {onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className={`absolute -top-2 -right-2 ${clearSize} bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
            >
              <X
                className={
                  size === "small" ? "w-2.5 h-2.5" : size === "large" ? "w-4 h-4" : "w-3 h-3"
                }
              />
            </button>
          )}

          {/* Amount Badge */}
          {amount && amount > 0 && !allowAmount && (
            <div className="absolute bottom-1 right-1 bg-background text-foreground text-xs font-bold px-1.5 py-0.5 rounded shadow-lg border border-primary/20">
              {amount} mB
            </div>
          )}

          {/* Amount Input */}
          {allowAmount && onAmountChange && (
            <input
              type="number"
              min="1"
              value={amount || 1000}
              onChange={(e) => onAmountChange(Math.max(1, parseInt(e.target.value) || 1000))}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-1 right-1 w-16 h-6 bg-background text-foreground text-xs font-bold px-1 rounded shadow-lg border border-primary/20 text-center"
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className={`${plusSize} text-muted-foreground`} />
        </div>
      )}
    </div>
  );
};
