"use client";

import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Code editor component for H2 language.
 *
 * Simple textarea-based editor with monospace font and syntax highlighting potential.
 */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: CodeEditorProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          "w-full h-full p-4 resize-none",
          "font-mono text-sm leading-relaxed",
          "bg-transparent text-foreground",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        aria-label="H2 code editor"
      />
      {/* Line numbers could be added here in the future */}
    </div>
  );
}
