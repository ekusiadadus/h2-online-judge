import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Header Component Tests
 *
 * Tests for the navigation header component.
 */

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      home: "Home",
      playground: "Playground",
      problems: "Problems",
      about: "About",
    };
    return translations[key] || key;
  },
  useLocale: () => "en",
}));

// Mock navigation
vi.mock("../../../i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Import after mocks
import { Header } from "../../../components/layout/header";

describe("Header", () => {
  it("renders the logo/brand name", () => {
    render(<Header />);

    expect(screen.getByText("Herbert")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /playground/i })
    ).toBeInTheDocument();
  });

  it("renders language switcher", () => {
    render(<Header />);

    // Should have language options
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("has correct navigation hrefs", () => {
    render(<Header />);

    const homeLink = screen.getByRole("link", { name: /home/i });
    const playgroundLink = screen.getByRole("link", { name: /playground/i });

    expect(homeLink).toHaveAttribute("href", "/");
    expect(playgroundLink).toHaveAttribute("href", "/playground");
  });

  it("applies active state to current route", () => {
    render(<Header />);

    const homeLink = screen.getByRole("link", { name: /home/i });
    // Home should be active since we mocked usePathname to return "/"
    expect(homeLink).toHaveClass("text-primary");
  });
});

describe("Header accessibility", () => {
  it("has navigation landmark", () => {
    render(<Header />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has accessible brand link", () => {
    render(<Header />);

    const brandLink = screen.getByRole("link", { name: /herbert/i });
    expect(brandLink).toBeInTheDocument();
  });
});
