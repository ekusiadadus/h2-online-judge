import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Footer Component Tests
 *
 * Tests for the footer component.
 */

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      copyright: "© 2025 ekusiadadus. All rights reserved.",
    };
    return translations[key] || key;
  },
}));

// Import after mocks
import { Footer } from "../../../components/layout/footer";

describe("Footer", () => {
  it("renders copyright text", () => {
    render(<Footer />);

    expect(
      screen.getByText(/© 2025 ekusiadadus. All rights reserved./i)
    ).toBeInTheDocument();
  });

  it("has contentinfo role", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
