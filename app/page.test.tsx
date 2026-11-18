import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomePage from "@/app/page";
import { projects } from "@/content/projects";

describe("home page (list view)", () => {
  test("shows Sam's name as the only top-level heading", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Samuel Orth" })).toBeInTheDocument();
  });

  test("has banner, main and footer landmarks", () => {
    render(<HomePage />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  test("hero contact row links to email, LinkedIn and GitHub", () => {
    render(<HomePage />);
    const contact = within(screen.getByRole("navigation", { name: "Contact" }));
    expect(contact.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      "mailto:samorthtech@gmail.com",
    );
    expect(contact.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/samuelorthtech",
    );
    expect(contact.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/Theesamkos",
    );
  });

  test("renders one card per project with pitch, bullets and skills", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("article")).toHaveLength(8);

    for (const project of projects) {
      const card = within(screen.getByRole("article", { name: project.title }));
      expect(card.getByRole("heading", { level: 3, name: project.title })).toBeInTheDocument();
      expect(card.getByText(project.pitch)).toBeInTheDocument();
      for (const bullet of project.bullets) expect(card.getByText(bullet)).toBeInTheDocument();
      const skills = within(card.getByRole("list", { name: `${project.title} skills` }));
      expect(skills.getAllByRole("listitem")).toHaveLength(project.skills.length);
      expect(card.getByText("Coming soon")).toBeInTheDocument();
    }
  });

  test("public projects link their repo; private and team projects show a chip and no link", () => {
    render(<HomePage />);
    for (const project of projects) {
      const card = within(screen.getByRole("article", { name: project.title }));
      if (project.visibility === "public") {
        expect(card.getByRole("link", { name: /code/i })).toHaveAttribute(
          "href",
          `https://github.com/Theesamkos/${project.id}`,
        );
      } else {
        expect(card.queryByRole("link")).toBeNull();
        expect(
          card.getByText(project.visibility === "team" ? "Team" : "Private"),
        ).toBeInTheDocument();
      }
    }
  });
});
