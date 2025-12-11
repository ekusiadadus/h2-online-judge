"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CompileResult } from "@/lib/h2lang/types";
import { CheckCircle, XCircle } from "lucide-react";

interface OutputPanelProps {
  compileResult: CompileResult | null;
  currentStep: number;
  className?: string;
}

/**
 * Output panel for displaying compilation results and errors.
 */
export function OutputPanel({
  compileResult,
  currentStep,
  className,
}: OutputPanelProps) {
  const t = useTranslations("playground.output");

  const isSuccess = compileResult?.status === "success";
  const isError = compileResult?.status === "error";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <h2 className="text-sm font-medium mb-2 text-muted-foreground">
        {t("title")}
      </h2>

      <div className="font-mono text-sm">
        {!compileResult && (
          <p className="text-muted-foreground">
            {t("waiting", { defaultValue: "Press Run or Step to compile and execute." })}
          </p>
        )}

        {isSuccess && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span>{t("success")}</span>
            </div>
            <div className="text-muted-foreground">
              <span>
                Step: {currentStep} / {compileResult.program.max_steps}
              </span>
              <span className="mx-2">|</span>
              <span>
                Agents: {compileResult.program.agents.length}
              </span>
            </div>
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
