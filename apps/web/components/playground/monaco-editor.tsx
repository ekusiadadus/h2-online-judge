"use client";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Monaco-based code editor for H2 language.
 *
 * Features:
 * - Syntax highlighting (planned)
 * - Line numbers
 * - Dark mode support
 * - Auto-resize
 */
export function MonacoCodeEditor({
  value,
  onChange,
  className,
}: MonacoCodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn("h-full w-full", className)}>
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
