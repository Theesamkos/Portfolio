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
