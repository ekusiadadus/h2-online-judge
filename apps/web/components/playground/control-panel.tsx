"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, StepForward, RotateCcw } from "lucide-react";

interface ControlPanelProps {
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  isRunning: boolean;
  speed: number;
  className?: string;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

/**
 * Control panel for playground simulation.
 *
 * Provides buttons for run, step, reset, and speed control.
 */
export function ControlPanel({
  onRun,
  onStep,
  onReset,
  onSpeedChange,
  isRunning,
  speed,
  className,
}: ControlPanelProps) {
  const t = useTranslations("playground.controls");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Run button */}
      <Button onClick={onRun} disabled={isRunning} variant="default" size="sm">
        <Play className="w-4 h-4 mr-2" />
        {t("run")}
      </Button>

      {/* Step button */}
      <Button onClick={onStep} disabled={isRunning} variant="secondary" size="sm">
        <StepForward className="w-4 h-4 mr-2" />
        {t("step")}
      </Button>

      {/* Reset button */}
      <Button onClick={onReset} variant="outline" size="sm">
        <RotateCcw className="w-4 h-4 mr-2" />
        {t("reset")}
      </Button>

      {/* Speed control */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">{t("speed")}:</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => onSpeedChange(option)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                speed === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
