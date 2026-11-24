import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Chip, type ChipTone } from "./Chip";

describe("Chip", () => {
  test("outline is the default: a plain pill with ink text and no dot", () => {
    render(<Chip>TypeScript</Chip>);
    const chip = screen.getByText("TypeScript");
    expect(chip).toHaveAttribute("data-tone", "outline");
    expect(chip).toHaveClass("rounded-full", "border-line", "text-ink");
    expect(chip.querySelector("[aria-hidden]")).toBeNull();
  });

  const statusTones: [ChipTone, string, string, string][] = [
    ["live", "bg-live", "text-live-ink", "bg-live-soft"],
    ["video", "bg-accent", "text-accent-ink", "bg-accent-soft"],
    ["coming-soon", "bg-warn", "text-warn-ink", "bg-warn-soft"],
  ];

  test.each(statusTones)(
    "%s: dot in the semantic color, text in its ink shade",
    (tone, dotClass, textClass, fillClass) => {
      render(<Chip tone={tone}>Status</Chip>);
      const chip = screen.getByText("Status");
      expect(chip).toHaveAttribute("data-tone", tone);
      expect(chip).toHaveClass(textClass, fillClass, "font-mono", "uppercase");
      // The text must never use the base color: it fails AA as small text.
      expect(chip).not.toHaveClass(dotClass.replace("bg-", "text-"));
      const dot = chip.querySelector("[aria-hidden='true']");
      expect(dot).toHaveClass(dotClass, "rounded-full");
    },
  );

  test("muted (PRIVATE / TEAM) is a quiet outline with no dot", () => {
    render(<Chip tone="muted">Private</Chip>);
    const chip = screen.getByText("Private");
    expect(chip).toHaveClass("border-ink-dim", "text-ink-dim");
    expect(chip.querySelector("[aria-hidden]")).toBeNull();
  });

  test("renders as a list item when asked", () => {
    render(
      <ul>
        <Chip as="li">RAG</Chip>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("RAG");
  });
});
