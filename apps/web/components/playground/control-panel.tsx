"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Square, StepForward, RotateCcw, Route, CheckCircle, XCircle, Loader2, Circle } from "lucide-react";

export type ExecutionStatus = "ready" | "running" | "success" | "error";

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
  /** Disable interactive controls (e.g., until compiler ready) */
  disabled?: boolean;
  /** Current execution status for status badge */
  status?: ExecutionStatus;
  /** Current step number (for display in running state) */
  currentStep?: number;
  /** Maximum steps (for display in running state) */
  maxSteps?: number;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

/**
 * Status badge component showing current execution state.
 */
function StatusBadge({
  status,
  currentStep,
  maxSteps,
  t,
}: {
  status: ExecutionStatus;
  currentStep?: number;
  maxSteps?: number;
  t: (key: string, options?: { defaultValue?: string }) => string;
}) {
  const configs = {
    ready: {
      icon: Circle,
      label: t("status.ready", { defaultValue: "Ready" }),
      className: "text-muted-foreground bg-muted",
    },
    running: {
      icon: Loader2,
      label: currentStep !== undefined && maxSteps !== undefined
        ? `${currentStep}/${maxSteps}`
        : t("status.running", { defaultValue: "Running" }),
      className: "text-primary bg-primary/10 border-primary/20",
      iconClassName: "animate-spin",
    },
    success: {
      icon: CheckCircle,
      label: t("status.success", { defaultValue: "Done" }),
      className: "text-success bg-success/10 border-success/20",
    },
    error: {
      icon: XCircle,
      label: t("status.error", { defaultValue: "Error" }),
      className: "text-destructive bg-destructive/10 border-destructive/20",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      data-testid="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", "iconClassName" in config ? config.iconClassName : "")} />
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Control panel for playground simulation.
 *
 * Provides buttons for run, step, reset, speed control, and status display.
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
  disabled = false,
  status = "ready",
  currentStep,
  maxSteps,
}: ControlPanelProps) {
  const t = useTranslations("playground.controls");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Status Badge */}
      <StatusBadge
        status={status}
        currentStep={currentStep}
        maxSteps={maxSteps}
        t={t}
      />

      {/* Run/Stop button - toggles based on running state */}
      {isRunning && onStop ? (
        <Button onClick={onStop} variant="destructive" size="sm" disabled={disabled}>
          <Square className="w-4 h-4 mr-2" />
          {t("stop")}
        </Button>
      ) : (
        <Button onClick={onRun} variant="default" size="sm" disabled={disabled}>
          <Play className="w-4 h-4 mr-2" />
          {t("run")}
        </Button>
      )}

      {/* Step button */}
      <Button onClick={onStep} disabled={isRunning || disabled} variant="secondary" size="sm">
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
