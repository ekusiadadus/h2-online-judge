"use client";

import { cn } from "@/lib/utils";
import { Circle, Square, AlertTriangle, Eraser, Move } from "lucide-react";

/** Tool types for the problem editor */
export type ToolType = "goal" | "wall" | "trap" | "start" | "erase";

interface ToolPaletteProps {
  /** Currently selected tool */
  selectedTool: ToolType;
  /** Callback when a tool is selected */
  onToolSelect: (tool: ToolType) => void;
  /** Whether edit mode is enabled */
  editMode: boolean;
  /** Callback to toggle edit mode */
  onEditModeToggle: () => void;
  className?: string;
}

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolButton({ tool, icon, label, selected, onClick, disabled }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
        "min-w-[60px] gap-1",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted hover:bg-muted/80 text-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

/**
 * Tool palette for selecting elements to place on the grid.
 *
 * Tools:
 * - Goal: White circle (target)
 * - Wall: Black block (obstacle)
 * - Trap: Gray circle (resets goals)
 * - Start: Set robot start position
 * - Erase: Remove elements
 */
export function ToolPalette({
  selectedTool,
  onToolSelect,
  editMode,
  onEditModeToggle,
  className,
}: ToolPaletteProps) {
  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: "goal", icon: <Circle className="h-5 w-5" />, label: "Goal" },
    { type: "wall", icon: <Square className="h-5 w-5" />, label: "Wall" },
    { type: "trap", icon: <AlertTriangle className="h-5 w-5" />, label: "Trap" },
    { type: "start", icon: <Move className="h-5 w-5" />, label: "Start" },
    { type: "erase", icon: <Eraser className="h-5 w-5" />, label: "Erase" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Edit mode toggle */}
      <button
        type="button"
        onClick={onEditModeToggle}
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          editMode
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        {editMode ? "Exit Edit" : "Edit Mode"}
      </button>

      {/* Separator */}
      {editMode && <div className="w-px h-8 bg-border" />}

      {/* Tool buttons */}
      {editMode && (
        <div className="flex gap-1">
          {tools.map((tool) => (
            <ToolButton
              key={tool.type}
              tool={tool.type}
              icon={tool.icon}
              label={tool.label}
              selected={selectedTool === tool.type}
              onClick={() => onToolSelect(tool.type)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
