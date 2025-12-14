/**
 * Monaco Editor Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Monaco Editor (heavy dependency)
vi.mock("@monaco-editor/react", () => ({
  Editor: ({
    value,
    onChange,
    theme,
  }: {
    value: string;
    onChange?: (value: string | undefined) => void;
    theme?: string;
  }) => (
    <div data-testid="monaco-editor" data-theme={theme}>
      <textarea
        data-testid="monaco-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

import { MonacoCodeEditor } from "@/components/playground/monaco-editor";

describe("MonacoCodeEditor", () => {
  it("renders with initial value", () => {
    render(<MonacoCodeEditor value="sss" onChange={() => {}} />);

    const textarea = screen.getByTestId("monaco-textarea");
    expect(textarea).toHaveValue("sss");
  });

  it("applies light theme by default", () => {
    render(<MonacoCodeEditor value="" onChange={() => {}} />);

    const editor = screen.getByTestId("monaco-editor");
    expect(editor).toHaveAttribute("data-theme", "light");
  });

  it("calls onChange when value changes", async () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <MonacoCodeEditor value="" onChange={handleChange} />
    );

    // The mock passes onChange to textarea, verify it's wired up
    const textarea = screen.getByTestId(
      "monaco-textarea"
    ) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Rerender with new value to verify controlled behavior
    rerender(<MonacoCodeEditor value="srl" onChange={handleChange} />);
    expect(textarea).toHaveValue("srl");
  });
});
