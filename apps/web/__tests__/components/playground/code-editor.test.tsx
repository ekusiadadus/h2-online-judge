import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeEditor } from "../../../components/playground/code-editor";

describe("CodeEditor", () => {
  it("renders textarea with correct value", () => {
    render(<CodeEditor value="0: srl" onChange={() => {}} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("0: srl");
  });

  it("calls onChange when text is entered", () => {
    const handleChange = vi.fn();
    render(<CodeEditor value="" onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "0: s" } });

    expect(handleChange).toHaveBeenCalledWith("0: s");
  });

  it("displays placeholder text", () => {
    render(
      <CodeEditor value="" onChange={() => {}} placeholder="Enter code here" />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("placeholder", "Enter code here");
  });

  it("disables textarea when disabled prop is true", () => {
    render(<CodeEditor value="" onChange={() => {}} disabled />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("has accessible label", () => {
    render(<CodeEditor value="" onChange={() => {}} />);

    expect(screen.getByLabelText("H2 code editor")).toBeInTheDocument();
  });
});
