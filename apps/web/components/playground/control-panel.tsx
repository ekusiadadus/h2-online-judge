"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Square, StepForward, RotateCcw, Route } from "lucide-react";

interface ControlPanelProps {
  onRun: () => void;
  onStep: () => void;
  onStop?: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  isRunning: boolean;
  speed: number;
  className?: string;
  /** Show path trail toggle */
  showPath?: boolean;
  /** Callback when path toggle changes */
  onShowPathChange?: (show: boolean) => void;
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
  onStop,
  onReset,
  onSpeedChange,
  isRunning,
  speed,
  className,
  showPath = false,
  onShowPathChange,
}: ControlPanelProps) {
  const t = useTranslations("playground.controls");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Run/Stop button - toggles based on running state */}
      {isRunning && onStop ? (
        <Button onClick={onStop} variant="destructive" size="sm">
          <Square className="w-4 h-4 mr-2" />
          {t("stop")}
        </Button>
      ) : (
        <Button onClick={onRun} variant="default" size="sm">
          <Play className="w-4 h-4 mr-2" />
          {t("run")}
        </Button>
      )}

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

      {/* Path toggle */}
      {onShowPathChange && (
        <Button
          onClick={() => onShowPathChange(!showPath)}
          variant={showPath ? "default" : "outline"}
          size="sm"
        >
          <Route className="w-4 h-4 mr-2" />
          {t("path", { defaultValue: "経路" })}
        </Button>
      )}

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
