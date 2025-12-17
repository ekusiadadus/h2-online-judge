"use client";

import { useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface CodeEditorRef {
  /**
   * Jump to and highlight a specific line and column.
   */
  goToLine: (line: number, column: number) => void;
  /**
   * Focus the editor.
   */
  focus: () => void;
}

/**
 * Code editor component for H2 language.
 *
 * Simple textarea-based editor with monospace font.
 * Exposes goToLine method for error navigation.
 */
export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  function CodeEditor(
    { value, onChange, placeholder, className, disabled = false },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Jump to a specific line and column in the editor.
     * Selects the entire line and scrolls it into view.
     */
    const goToLine = useCallback(
      (line: number, column: number) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Split value into lines
        const lines = value.split("\n");

        // Calculate character position for the start of the target line
        let startPos = 0;
        for (let i = 0; i < line - 1 && i < lines.length; i++) {
          const lineContent = lines[i];
          if (lineContent !== undefined) {
            startPos += lineContent.length + 1; // +1 for newline
          }
        }

        // Calculate end position (end of line or specified column)
        const targetLine = lines[line - 1] || "";
        const endPos = startPos + targetLine.length;

        // Focus and set selection
        textarea.focus();
        textarea.setSelectionRange(startPos, endPos);

        // Scroll the textarea to show the selected line
        // Calculate approximate scroll position based on line height
        const lineHeight = 24; // Approximate line height in pixels
        const scrollTop = Math.max(0, (line - 3) * lineHeight);
        textarea.scrollTop = scrollTop;
      },
      [value]
    );

    const focus = useCallback(() => {
      textareaRef.current?.focus();
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        goToLine,
        focus,
      }),
      [goToLine, focus]
    );

    return (
      <div
        className={cn(
          "relative rounded-lg border border-border bg-card overflow-hidden",
          className
        )}
      >
        <textarea
          ref={textareaRef}
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
      </div>
    );
  }
);
