"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CompileResult, CommandType } from "@/lib/h2lang/types";
import { CheckCircle, XCircle, ArrowUp, RotateCw, RotateCcw } from "lucide-react";

interface OutputPanelProps {
  compileResult: CompileResult | null;
  currentStep: number;
  className?: string;
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

/**
 * Output panel for displaying compilation results, timeline, and errors.
 */
export function OutputPanel({
  compileResult,
  currentStep,
  className,
}: OutputPanelProps) {
  const t = useTranslations("playground.output");

  const isSuccess = compileResult?.status === "success";
  const isError = compileResult?.status === "error";

  const program = isSuccess ? compileResult.program : null;
  const maxSteps = program?.max_steps ?? 0;
  const progressPercent = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="font-mono text-sm">
        {!compileResult && (
          <p className="text-muted-foreground">
            {t("waiting", { defaultValue: "Press Run or Step to compile and execute." })}
          </p>
        )}

        {isSuccess && program && (
          <div className="space-y-3">
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

            {/* Timeline */}
            {program.timeline.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground">Timeline</h3>
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {program.timeline.map((entry, index) => {
                    const isCurrent = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isPending = index > currentStep;

                    return (
                      <div
                        key={entry.step}
                        data-testid={`timeline-step-${index}`}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
                          isCurrent && "bg-primary/20 font-bold border-l-2 border-primary",
                          isCompleted && "text-muted-foreground",
                          isPending && !isCurrent && "text-muted-foreground/60"
                        )}
                      >
                        <span className="w-6 text-right tabular-nums">
                          {index}
                        </span>
                        <span className="text-muted-foreground">:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {entry.agent_commands.map((agentCmd, cmdIndex) => (
                            <span
                              key={cmdIndex}
                              className={cn(
                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded",
                                isCurrent ? "bg-primary/30" : "bg-muted"
                              )}
                            >
                              <CommandIcon type={agentCmd.command.type} />
                              <span className="text-[10px]">
                                {getCommandLabel(agentCmd.command.type)}
                              </span>
                            </span>
                          ))}
                        </div>
                        {isCurrent && (
                          <span className="ml-auto text-primary text-[10px]">
                            current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
