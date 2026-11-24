import { beforeEach, describe, expect, test } from "vitest";
import { initialUiState, useUiStore } from "@/store/ui";

const state = () => useUiStore.getState();

beforeEach(() => {
  // Merge (not replace) so the actions stay on the store.
  useUiStore.setState(initialUiState);
});

describe("ui store", () => {
  test("starts with no focus, no filters, in list view", () => {
    expect(state().activeProjectId).toBeNull();
    expect(state().filters).toEqual({ skills: [], tags: [] });
    expect(state().viewMode).toBe("list");
    expect(state().frontProjectId).toBeNull();
    expect(state().ringReady).toBe(false);
    expect(state().tier).toBe("high");
    expect(state().coreActivity).toBe(0);
  });

  describe("front project (the ring) and active project (the panel)", () => {
    test("turning the ring does not select a project", () => {
      state().setFrontProject("math-tiles");
      expect(state().frontProjectId).toBe("math-tiles");
      expect(state().activeProjectId).toBeNull();
    });

    test("selecting a project brings it to the front", () => {
      state().setFrontProject("math-tiles");
      state().focusProject("legacylens");
      expect(state().frontProjectId).toBe("legacylens");
    });

    test("the front follows every change of selection, wherever it comes from", () => {
      // The panel's Previous/Next and the guide's tool call both dispatch focusProject.
      for (const id of ["software-factory", "acme-invoice-agent", "servicecore"] as const) {
        state().focusProject(id);
        expect(state().frontProjectId).toBe(id);
        expect(state().activeProjectId).toBe(id);
      }
    });

    test("closing the panel leaves the ring where it is", () => {
      state().focusProject("legacylens");
      state().focusProject(null);
      expect(state().activeProjectId).toBeNull();
      expect(state().frontProjectId).toBe("legacylens");
    });

    test("turning the ring while a project is selected moves the selection with it", () => {
      state().focusProject("legacylens");
      state().setFrontProject("chatbridge");
      expect(state().activeProjectId).toBe("chatbridge");
      expect(state().frontProjectId).toBe("chatbridge");
    });
  });

  describe("ring state", () => {
    test("records readiness and the effects tier", () => {
      state().setRingReady(true);
      state().setTier("low");
      expect(state().ringReady).toBe(true);
      expect(state().tier).toBe("low");
    });

    test("core activity is clamped to 0–1", () => {
      state().setCoreActivity(3);
      expect(state().coreActivity).toBe(1);
      state().setCoreActivity(-1);
      expect(state().coreActivity).toBe(0);
    });
  });

  describe("focusProject", () => {
    test("sets the active project", () => {
      state().focusProject("legacylens");
      expect(state().activeProjectId).toBe("legacylens");
    });

    test("moves focus from one project to another", () => {
      state().focusProject("legacylens");
      state().focusProject("math-tiles");
      expect(state().activeProjectId).toBe("math-tiles");
    });

    test("clears the focus with null", () => {
      state().focusProject("legacylens");
      state().focusProject(null);
      expect(state().activeProjectId).toBeNull();
    });

    test("leaves filters and view mode alone", () => {
      state().setFilters({ skills: ["RAG"] });
      state().setViewMode("ring");
      state().focusProject("legacylens");
      expect(state().filters.skills).toEqual(["RAG"]);
      expect(state().viewMode).toBe("ring");
    });
  });

  describe("setFilters", () => {
    test("sets both lists", () => {
      state().setFilters({ skills: ["RAG", "Evals"], tags: ["agents"] });
      expect(state().filters).toEqual({ skills: ["RAG", "Evals"], tags: ["agents"] });
    });

    test("keeps the list that was left out", () => {
      state().setFilters({ skills: ["RAG"], tags: ["agents"] });
      state().setFilters({ tags: ["edtech"] });
      expect(state().filters).toEqual({ skills: ["RAG"], tags: ["edtech"] });
    });

    test("replaces a list rather than appending to it", () => {
      state().setFilters({ skills: ["RAG"] });
      state().setFilters({ skills: ["Evals"] });
      expect(state().filters.skills).toEqual(["Evals"]);
    });

    test("drops duplicate values", () => {
      state().setFilters({ skills: ["RAG", "RAG", "Evals"] });
      expect(state().filters.skills).toEqual(["RAG", "Evals"]);
    });
  });

  describe("clearFilters", () => {
    test("empties both lists", () => {
      state().setFilters({ skills: ["RAG"], tags: ["agents"] });
      state().clearFilters();
      expect(state().filters).toEqual({ skills: [], tags: [] });
    });

    test("keeps the focused project and view mode", () => {
      state().focusProject("chatbridge");
      state().setViewMode("ring");
      state().setFilters({ skills: ["RAG"] });
      state().clearFilters();
      expect(state().activeProjectId).toBe("chatbridge");
      expect(state().viewMode).toBe("ring");
    });
  });

  describe("setViewMode", () => {
    test("switches to ring and back to list", () => {
      state().setViewMode("ring");
      expect(state().viewMode).toBe("ring");
      state().setViewMode("list");
      expect(state().viewMode).toBe("list");
    });
  });

  test("notifies subscribers when an action runs", () => {
    const seen: (string | null)[] = [];
    const unsubscribe = useUiStore.subscribe((next) => seen.push(next.activeProjectId));
    state().focusProject("servicecore");
    unsubscribe();
    state().focusProject(null);
    expect(seen).toEqual(["servicecore"]);
  });
});
