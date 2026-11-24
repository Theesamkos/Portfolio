import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  test("renders a link when given href", () => {
    render(<Button href="/resume.pdf">Download resume</Button>);
    const link = screen.getByRole("link", { name: "Download resume" });
    expect(link).toHaveAttribute("href", "/resume.pdf");
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("renders a type=button button without href and handles clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Next</Button>);
    const button = screen.getByRole("button", { name: "Next" });
    expect(button).toHaveAttribute("type", "button");
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("primary is the default: solid accent with on-accent text", () => {
    render(<Button href="#projects">View projects</Button>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-variant", "primary");
    expect(link).toHaveClass("bg-accent", "text-on-accent");
  });

  test("secondary is a hairline outline on glass with ink text", () => {
    render(
      <Button href="#projects" variant="secondary">
        List view
      </Button>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-variant", "secondary");
    expect(link).toHaveClass("border-line", "bg-glass", "text-ink");
    expect(link).not.toHaveClass("bg-accent");
  });

  test("both variants are 44px pills", () => {
    render(
      <>
        <Button href="#a">A</Button>
        <Button variant="secondary">B</Button>
      </>,
    );
    for (const element of [screen.getByRole("link"), screen.getByRole("button")]) {
      expect(element).toHaveClass("min-h-11", "rounded-full");
    }
  });

  test("the icon slot renders before the label, or after with iconPosition=end", () => {
    const { rerender } = render(<Button icon={<svg data-testid="icon" />}>Label</Button>);
    const icon = () => screen.getByTestId("icon");
    const label = () => screen.getByText("Label");
    expect(icon().compareDocumentPosition(label()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    rerender(
      <Button icon={<svg data-testid="icon" />} iconPosition="end">
        Label
      </Button>,
    );
    expect(icon().compareDocumentPosition(label()) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  test("className is appended, not replaced", () => {
    render(
      <Button href="#a" className="w-full">
        A
      </Button>,
    );
    expect(screen.getByRole("link")).toHaveClass("w-full", "min-h-11");
  });
});
