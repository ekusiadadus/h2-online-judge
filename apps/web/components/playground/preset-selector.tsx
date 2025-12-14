"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { presets, type Preset } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
  className?: string;
}

/**
 * Preset selector component for quickly loading example problems.
 */
export function PresetSelector({ onSelect, className }: PresetSelectorProps) {
  const t = useTranslations("playground");

  const difficultyColors = {
    easy: "bg-green-100 text-green-800 hover:bg-green-200 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300",
    hard: "bg-red-100 text-red-800 hover:bg-red-200 border-red-300",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">
        {t("presets.label")}:
      </span>
      {presets.map((preset) => (
        <Button
          key={preset.id}
          variant="outline"
          size="sm"
          className={cn(
            "text-xs px-2 py-1 h-7",
            difficultyColors[preset.difficulty]
          )}
          onClick={() => onSelect(preset)}
        >
          {t(preset.nameKey)}
        </Button>
      ))}
    </div>
  );
}
