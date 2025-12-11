import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders Card component", () => {
    render(<Card data-testid="card">Card Content</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("applies custom className to Card", () => {
    render(
      <Card data-testid="card" className="custom-class">
        Card Content
      </Card>
    );
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("renders CardHeader component", () => {
    render(<CardHeader data-testid="header">Header Content</CardHeader>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardTitle component", () => {
    render(<CardTitle>Test Title</CardTitle>);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders CardDescription component", () => {
    render(<CardDescription>Test Description</CardDescription>);
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders CardContent component", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders CardFooter component", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders complete Card with all subcomponents", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
