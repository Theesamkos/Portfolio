import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "@/app/page";

test("home page shows Sam's name as the top-level heading", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "Samuel Orth" })).toBeInTheDocument();
});
