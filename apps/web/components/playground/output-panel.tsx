"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import type { CompileResult, CommandType } from "@/lib/h2lang/types";
import {
  CheckCircle,
  XCircle,
  ArrowUp,
  RotateCw,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Check,
  Circle,
} from "lucide-react";

// P1: Virtual scrolling configuration
const VISIBLE_RANGE = 50; // Number of steps to show before/after current step
const ROW_HEIGHT = 28; // Approximate height of each timeline row in pixels

interface OutputPanelProps {
  compileResult: CompileResult | null;
  currentStep: number;
  className?: string;
  /** Number of goals visited */
  visitedGoals?: number;
  /** Total number of goals */
  totalGoals?: number;
  /** Code byte count for scoring */
  byteCount?: number;
}

/**
 * Get icon for command type.
 */
function CommandIcon({ type }: { type: CommandType }) {
  switch (type) {
    case "straight":
      return <ArrowUp className="w-3 h-3" />;
    case "rotate_right":
      return <RotateCw className="w-3 h-3" />;
    case "rotate_left":
      return <RotateCcw className="w-3 h-3" />;
    default:
      return null;
  }
}

/**
 * Get short label for command type.
 */
function getCommandShortLabel(type: CommandType): string {
  switch (type) {
    case "straight":
      return "s";
    case "rotate_right":
      return "r";
    case "rotate_left":
      return "l";
    default:
      return type;
  }
}

/**
 * Get label for command type.
 */
function getCommandLabel(type: CommandType): string {
  switch (type) {
    case "straight":
      return "straight";
    case "rotate_right":
      return "rotate_right";
    case "rotate_left":
      return "rotate_left";
    default:
      return type;
  }
}

// P1: Memoized timeline row to prevent unnecessary re-renders
interface TimelineRowProps {
  index: number;
  agentCommands: Array<{
    agent_id: number;
    command: { type: CommandType };
  }>;
  isCurrent: boolean;
  isCompleted: boolean;
}

const TimelineRow = memo(function TimelineRow({
  index,
  agentCommands,
  isCurrent,
  isCompleted,
}: TimelineRowProps) {
  const isPending = !isCurrent && !isCompleted;

  return (
    <div
      data-testid={`timeline-step-${index}`}
      className={cn(
        "flex items-center gap-1 px-1 py-0.5 rounded text-xs transition-colors",
        isCurrent && "bg-primary/20 font-bold border-l-2 border-primary",
        isCompleted && "text-success",
        isPending && "text-muted-foreground/60"
      )}
      style={{ height: ROW_HEIGHT }}
    >
      {/* Status indicator: checkmark for completed, circle for current/pending */}
      <span className="w-4 flex-shrink-0 flex items-center justify-center">
        {isCompleted ? (
          <Check className="w-3 h-3 text-success" />
        ) : isCurrent ? (
          <Circle className="w-3 h-3 text-primary fill-primary" />
        ) : (
          <Circle className="w-2.5 h-2.5 text-muted-foreground/40" />
        )}
      </span>
      {/* Step number - left aligned */}
      <span className="w-8 tabular-nums text-left">{index}</span>
      {/* Commands */}
      <div className="flex items-center gap-1 flex-wrap">
        {agentCommands.map((agentCmd, cmdIndex) => (
          <span
            key={cmdIndex}
            className={cn(
              "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px]",
              isCurrent ? "bg-primary/30" : isCompleted ? "bg-success/20" : "bg-muted"
            )}
          >
            <span className={cn(
              "font-bold",
              isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
            )}>
              {getCommandShortLabel(agentCmd.command.type)}
            </span>
            <CommandIcon type={agentCmd.command.type} />
          </span>
        ))}
      </div>
      {isCurrent && (
        <span className="ml-auto text-primary text-[10px] font-medium">▶</span>
      )}
    </div>
  );
});

// P1: Virtualized timeline component
interface VirtualizedTimelineProps {
  timeline: Array<{
    step: number;
    agent_commands: Array<{
      agent_id: number;
      command: { type: CommandType };
    }>;
  }>;
  currentStep: number;
}

function VirtualizedTimeline({ timeline, currentStep }: VirtualizedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = timeline.length;

  // P1: Calculate visible range around currentStep
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, currentStep - VISIBLE_RANGE);
    const end = Math.min(totalItems - 1, currentStep + VISIBLE_RANGE);
    const items = timeline.slice(start, end + 1).map((entry, i) => ({
      ...entry,
      originalIndex: start + i,
    }));
    return { startIndex: start, endIndex: end, visibleItems: items };
  }, [timeline, currentStep, totalItems]);

  // P1 Fix: Use requestAnimationFrame to avoid forced reflow
  // Only auto-scroll when current step approaches window boundary
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use RAF to batch DOM read/write and avoid forced reflow
    requestAnimationFrame(() => {
      const relativeIndex = currentStep - startIndex;
      // Only scroll if current step is near the edge of visible area
      if (relativeIndex < 5 || relativeIndex > VISIBLE_RANGE * 2 - 5) {
        const targetScroll = Math.max(0, (relativeIndex - 5) * ROW_HEIGHT);
        container.scrollTop = targetScroll;
      }
    });
  }, [currentStep, startIndex]);

  // Calculate spacer heights for virtual scrolling
  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (totalItems - endIndex - 1) * ROW_HEIGHT);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h3 className="text-xs font-medium text-muted-foreground mb-1">
        Timeline ({totalItems} steps)
      </h3>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ contain: "strict" }}
      >
        {/* Top spacer for virtualization */}
        {topSpacerHeight > 0 && (
          <div style={{ height: topSpacerHeight }} aria-hidden="true" />
        )}

        {/* Visible rows only */}
        {visibleItems.map((entry) => (
          <TimelineRow
            key={entry.step}
            index={entry.originalIndex}
            agentCommands={entry.agent_commands}
            isCurrent={entry.originalIndex === currentStep}
            isCompleted={entry.originalIndex < currentStep}
          />
        ))}

        {/* Bottom spacer for virtualization */}
        {bottomSpacerHeight > 0 && (
          <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

/**
 * Output panel for displaying compilation results, timeline, and errors.
 */
export function OutputPanel({
  compileResult,
  currentStep,
  className,
  visitedGoals = 0,
  totalGoals = 0,
  byteCount = 0,
}: OutputPanelProps) {
  const t = useTranslations("playground.output");

  const isSuccess = compileResult?.status === "success";
  const isError = compileResult?.status === "error";

  const program = isSuccess ? compileResult.program : null;
  const maxSteps = program?.max_steps ?? 0;
  const progressPercent = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;

  // Check if execution is complete
  const isExecutionComplete = isSuccess && currentStep >= maxSteps;
  const allGoalsVisited = totalGoals > 0 && visitedGoals >= totalGoals;
  const hasGoals = totalGoals > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 flex flex-col",
        className
      )}
    >
      <div className="font-mono text-sm flex flex-col flex-1 min-h-0">
        {!compileResult && (
          <p className="text-muted-foreground">
            {t("waiting", { defaultValue: "Press Run or Step to compile and execute." })}
          </p>
        )}

        {isSuccess && program && (
          <div className="space-y-3 flex flex-col flex-1 min-h-0">
            {/* Success message */}
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span>{t("success")}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={0}
                aria-valuemax={maxSteps}
                className="h-2 w-full bg-muted rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Step: <span className="font-bold text-foreground">{currentStep}</span> / {maxSteps}
                </span>
                <span>
                  Agents: {program.agents.length}
                </span>
              </div>
            </div>

            {/* Byte count display - CODE GOLF SCORE */}
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-accent/50 border border-border">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Score:</span>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {byteCount}
                </span>
                <span className="text-xs text-muted-foreground">bytes</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70">
                (lower is better)
              </div>
            </div>

            {/* Points display */}
            {hasGoals && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Points: <span className="font-bold text-foreground">{visitedGoals}</span> / {totalGoals}
                </span>
              </div>
            )}

            {/* Execution result */}
            {isExecutionComplete && hasGoals && (
              <div className="mt-2">
                {allGoalsVisited ? (
                  <div
                    data-testid="result-success"
                    className="flex items-center gap-2 text-success font-bold"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Success! All targets reached!</span>
                  </div>
                ) : (
                  <div
                    data-testid="result-failure"
                    className="flex items-center gap-2 text-destructive font-bold"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Failed: {totalGoals - visitedGoals} target(s) remaining</span>
                  </div>
                )}
              </div>
            )}

            {/* P1: Timeline with virtual scrolling */}
            {program.timeline.length > 0 && (
              <VirtualizedTimeline
                timeline={program.timeline}
                currentStep={currentStep}
              />
            )}
          </div>
        )}

        {isError && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <span>{t("error")}</span>
            </div>
            <ul className="list-none space-y-1">
              {compileResult.errors.map((error, index) => (
                <li key={index} className="text-destructive">
                  Line {error.line}, Column {error.column}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
