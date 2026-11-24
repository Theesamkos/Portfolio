import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import HomePage from "@/app/page";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";
import { initialUiState, useUiStore } from "@/store/ui";

// jsdom has no <dialog> methods and no matchMedia. These stand-ins only flip `open`;
// real open/close behavior (focus, Esc, backdrop) is covered in e2e/home.spec.ts.
beforeAll(() => {
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.show;
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

beforeEach(() => {
  act(() => useUiStore.setState(initialUiState));
});

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

  test("nav bar links to every section, the resume and contact", () => {
    render(<HomePage />);
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    expect(nav.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "#projects");
    expect(nav.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(nav.getByRole("link", { name: "Resume" })).toHaveAttribute("href", "/resume.pdf");
    expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");

    const banner = within(screen.getByRole("banner"));
    expect(banner.getByRole("link", { name: "List view" })).toHaveAttribute("href", "#projects");
    for (const link of banner.getAllByRole("link", { name: "Contact me" })) {
      expect(link).toHaveAttribute("href", "mailto:samorthtech@gmail.com");
    }
    expect(banner.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  test("every nav anchor points at an element on the page", () => {
    const { container } = render(<HomePage />);
    for (const id of ["top", "projects", "about", "contact"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  test("hero has the two actions; the resume button downloads /resume.pdf", () => {
    render(<HomePage />);
    const hero = within(screen.getByRole("region", { name: "Introduction" }));
    expect(hero.getByText(site.identity)).toBeInTheDocument();
    expect(hero.getByRole("link", { name: "View projects" })).toHaveAttribute("href", "#projects");
    const resume = hero.getByRole("link", { name: "Download resume" });
    expect(resume).toHaveAttribute("href", "/resume.pdf");
    expect(resume).toHaveAttribute("download");
  });

  test("about section shows the three sentences from lib/site.ts", () => {
    render(<HomePage />);
    const about = within(screen.getByRole("region", { name: "About" }));
    expect(site.about).toHaveLength(3);
    for (const sentence of site.about) expect(about.getByText(sentence)).toBeInTheDocument();
  });

  test("every card has a Details button that opens the detail panel for that project", () => {
    render(<HomePage />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).not.toHaveAttribute("open");

    for (const project of projects) {
      const card = within(screen.getByRole("article", { name: project.title }));
      fireEvent.click(card.getByRole("button", { name: `Details: ${project.title}` }));

      expect(useUiStore.getState().activeProjectId).toBe(project.id);
      expect(dialog).toHaveAttribute("open");
      const panel = within(dialog);
      expect(panel.getByRole("heading", { level: 2, name: project.title })).toBeInTheDocument();
      expect(panel.getByText(project.pitch)).toBeInTheDocument();
      for (const bullet of project.bullets) expect(panel.getByText(bullet)).toBeInTheDocument();
    }
  });

  test("detail panel: Next and Previous wrap around the ring, close clears the store", () => {
    render(<HomePage />);
    const first = projects[0]!;
    const last = projects.at(-1)!;
    act(() => useUiStore.getState().focusProject(first.id));
    const panel = within(screen.getByRole("dialog"));
    expect(panel.getByText("Project 01 / 08")).toBeInTheDocument();

    fireEvent.click(panel.getByRole("button", { name: "Previous" }));
    expect(useUiStore.getState().activeProjectId).toBe(last.id);
    expect(panel.getByRole("heading", { level: 2, name: last.title })).toBeInTheDocument();

    fireEvent.click(panel.getByRole("button", { name: "Next" }));
    expect(useUiStore.getState().activeProjectId).toBe(first.id);

    fireEvent.click(panel.getByRole("button", { name: "Close project details" }));
    expect(useUiStore.getState().activeProjectId).toBeNull();
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  test("detail panel: Esc closes it", () => {
    render(<HomePage />);
    act(() => useUiStore.getState().focusProject(projects[2]!.id));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useUiStore.getState().activeProjectId).toBeNull();
  });

  test("detail panel is modal in the list view and non-modal only in the ring view", () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, "show");
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    render(<HomePage />);

    act(() => useUiStore.getState().focusProject(projects[0]!.id));
    expect(showModal).toHaveBeenCalledOnce();
    expect(show).not.toHaveBeenCalled();

    act(() => useUiStore.getState().focusProject(null));
    act(() => useUiStore.getState().setViewMode("ring"));
    act(() => useUiStore.getState().focusProject(projects[1]!.id));
    expect(show).toHaveBeenCalledOnce();
    expect(showModal).toHaveBeenCalledOnce();

    show.mockRestore();
    showModal.mockRestore();
  });
});
