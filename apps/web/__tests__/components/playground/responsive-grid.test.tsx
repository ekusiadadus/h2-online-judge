/**
 * Tests for responsive grid component.
 * Verifies grid scales properly and doesn't overflow.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "@/components/playground/grid";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Responsive Grid", () => {
  it("renders grid with proper container", () => {
    render(
      <Grid
        program={null}
        currentStep={0}
        isRunning={false}
      />
    );

    const grid = screen.getByRole("img", { name: /robot grid/i });
    expect(grid).toBeInTheDocument();
  });

  it("grid container has overflow-hidden to prevent scrolling", () => {
    const { container } = render(
      <Grid
        program={null}
        currentStep={0}
        isRunning={false}
      />
    );

    // Grid should have overflow-hidden, not overflow-auto
    const gridContainer = container.querySelector(".overflow-hidden");
    expect(gridContainer).toBeInTheDocument();
  });

  it("grid maintains aspect ratio 1:1", () => {
    const { container } = render(
      <Grid
        program={null}
        currentStep={0}
        isRunning={false}
      />
    );

    // Check for aspect-square class
    const aspectContainer = container.querySelector(".aspect-square");
    expect(aspectContainer).toBeInTheDocument();
  });

  it("grid scales to fit container width", () => {
    const { container } = render(
      <Grid
        program={null}
        currentStep={0}
        isRunning={false}
        className="w-full"
      />
    );

    // Grid should have w-full to scale with container
    const gridWrapper = container.firstChild as HTMLElement;
    expect(gridWrapper).toHaveClass("w-full");
  });
});
