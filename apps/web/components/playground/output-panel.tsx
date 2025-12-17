"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import type { CompileResult, CommandType } from "@/lib/h2lang/types";
import {
  CheckCircle,
  XCircle,
  ArrowUp,
  RotateCw,
  RotateCcw,
  Pause,
  Trophy,
  AlertTriangle,
  Check,
  Circle,
  Terminal,
  AlertCircle,
  Clock,
} from "lucide-react";

// P1: Virtual scrolling configuration
const VISIBLE_RANGE = 50; // Number of steps to show before/after current step
const ROW_HEIGHT = 28; // Approximate height of each timeline row in pixels

type TabType = "console" | "problems" | "timeline";

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
  /** Callback when error is clicked (for jumping to line) */
  onErrorClick?: (line: number, column: number) => void;
  /** Optional id for aria-controls accessibility */
  id?: string;
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
    case "wait":
      return <Pause className="w-3 h-3" />;
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
    case "wait":
      return "·";
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
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const relativeIndex = currentStep - startIndex;
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
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ contain: "strict" }}
    >
      {topSpacerHeight > 0 && (
        <div style={{ height: topSpacerHeight }} aria-hidden="true" />
      )}
      {visibleItems.map((entry) => (
        <TimelineRow
          key={entry.step}
          index={entry.originalIndex}
          agentCommands={entry.agent_commands}
          isCurrent={entry.originalIndex === currentStep}
          isCompleted={entry.originalIndex < currentStep}
        />
      ))}
      {bottomSpacerHeight > 0 && (
        <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Tab button component
 */
function TabButton({
  active,
  onClick,
  children,
  icon: Icon,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
        "border-b-2 -mb-px",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 text-[10px] rounded-full",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

/**
 * Console tab content - shows execution status, progress, score
 */
function ConsoleContent({
  compileResult,
  currentStep,
  visitedGoals,
  totalGoals,
  byteCount,
  t,
}: {
  compileResult: CompileResult | null;
  currentStep: number;
  visitedGoals: number;
  totalGoals: number;
  byteCount: number;
  t: (key: string, options?: { defaultValue?: string; count?: number }) => string;
}) {
  const isSuccess = compileResult?.status === "success";
  const program = isSuccess ? compileResult.program : null;
  const maxSteps = program?.max_steps ?? 0;
  const progressPercent = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;
  const isExecutionComplete = isSuccess && currentStep >= maxSteps;
  const allGoalsVisited = totalGoals > 0 && visitedGoals >= totalGoals;
  const hasGoals = totalGoals > 0;

  if (!compileResult) {
    return (
      <p className="text-muted-foreground text-xs">
        {t("waiting", { defaultValue: "Press Run or Step to compile and execute." })}
      </p>
    );
  }

  if (!isSuccess) {
    return (
      <div className="flex items-center gap-2 text-destructive text-xs">
        <XCircle className="w-4 h-4" />
        <span>{t("error")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {/* Success message */}
      <div className="flex items-center gap-2 text-success">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{t("success")}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={0}
          aria-valuemax={maxSteps}
          className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            {t("step")}: <span className="font-bold text-foreground">{currentStep}</span> / {maxSteps}
          </span>
          <span>
            {t("agents")}: {program?.agents.length}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-accent/50 border border-border">
        <span className="text-muted-foreground">{t("score")}:</span>
        <span className="text-lg font-bold text-primary tabular-nums">{byteCount}</span>
        <span className="text-muted-foreground">{t("bytesUnit")}</span>
        <span className="text-[10px] text-muted-foreground/70 ml-auto">{t("lowerIsBetter")}</span>
      </div>

      {/* Points display */}
      {hasGoals && (
        <div className="text-muted-foreground">
          {t("points")}: <span className="font-bold text-foreground">{visitedGoals}</span> / {totalGoals}
        </div>
      )}

      {/* Execution result */}
      {isExecutionComplete && hasGoals && (
        <div className="mt-1">
          {allGoalsVisited ? (
            <div data-testid="result-success" className="flex items-center gap-2 text-success font-bold">
              <Trophy className="w-4 h-4" />
              <span>{t("successAllTargets")}</span>
            </div>
          ) : (
            <div data-testid="result-failure" className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{t("failedTargetsRemaining", { count: totalGoals - visitedGoals })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Problems tab content - shows compile errors
 */
function ProblemsContent({
  compileResult,
  onErrorClick,
  t,
}: {
  compileResult: CompileResult | null;
  onErrorClick?: (line: number, column: number) => void;
  t: (key: string, options?: { defaultValue?: string }) => string;
}) {
  const errors = compileResult?.status === "error" ? compileResult.errors : [];

  if (errors.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        {t("noProblems", { defaultValue: "No problems detected." })}
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {errors.map((error, index) => (
        <li
          key={index}
          onClick={() => onErrorClick?.(error.line, error.column)}
          className={cn(
            "flex items-start gap-2 text-xs text-destructive p-1.5 rounded",
            onErrorClick && "cursor-pointer hover:bg-destructive/10"
          )}
        >
          <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Line {error.line}, Column {error.column}: {error.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Timeline tab content - shows execution steps
 */
function TimelineContent({
  compileResult,
  currentStep,
  t,
}: {
  compileResult: CompileResult | null;
  currentStep: number;
  t: (key: string, options?: { defaultValue?: string; count?: number }) => string;
}) {
  const program = compileResult?.status === "success" ? compileResult.program : null;
  const timeline = program?.timeline ?? [];

  if (timeline.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        {t("noTimeline", { defaultValue: "No timeline available. Run the code to see execution steps." })}
      </p>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="text-xs text-muted-foreground mb-1">
        {t("timelineSteps", { count: timeline.length })}
      </div>
      <VirtualizedTimeline timeline={timeline} currentStep={currentStep} />
    </div>
  );
}

/**
 * Output panel with tabs for Console, Problems, and Timeline.
 */
export function OutputPanel({
  compileResult,
  currentStep,
  className,
  visitedGoals = 0,
  totalGoals = 0,
  byteCount = 0,
  onErrorClick,
  id,
}: OutputPanelProps) {
  const t = useTranslations("playground.output");
  const [activeTab, setActiveTab] = useState<TabType>("console");

  // Count errors for badge
  const errorCount = compileResult?.status === "error" ? compileResult.errors.length : 0;

  // Auto-switch to problems tab when there are errors
  useEffect(() => {
    if (errorCount > 0) {
      setActiveTab("problems");
    } else if (compileResult?.status === "success") {
      setActiveTab("console");
    }
  }, [errorCount, compileResult?.status]);

  return (
    <div
      id={id}
      className={cn(
        "rounded-lg border border-border bg-card flex flex-col",
        className
      )}
    >
      {/* Tab bar */}
      <div className="flex border-b border-border px-2" role="tablist">
        <TabButton
          active={activeTab === "console"}
          onClick={() => setActiveTab("console")}
          icon={Terminal}
        >
          {t("tabs.console", { defaultValue: "Console" })}
        </TabButton>
        <TabButton
          active={activeTab === "problems"}
          onClick={() => setActiveTab("problems")}
          icon={AlertCircle}
          badge={errorCount}
        >
          {t("tabs.problems", { defaultValue: "Problems" })}
        </TabButton>
        <TabButton
          active={activeTab === "timeline"}
          onClick={() => setActiveTab("timeline")}
          icon={Clock}
        >
          {t("tabs.timeline", { defaultValue: "Timeline" })}
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto p-3 font-mono text-sm">
        {activeTab === "console" && (
          <ConsoleContent
            compileResult={compileResult}
            currentStep={currentStep}
            visitedGoals={visitedGoals}
            totalGoals={totalGoals}
            byteCount={byteCount}
            t={t}
          />
        )}
        {activeTab === "problems" && (
          <ProblemsContent
            compileResult={compileResult}
            onErrorClick={onErrorClick}
            t={t}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineContent
            compileResult={compileResult}
            currentStep={currentStep}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
