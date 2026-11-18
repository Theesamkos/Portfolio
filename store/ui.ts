import { create } from "zustand";
import type { ProjectId } from "@/content/projects";

/**
 * The one UI store (docs/ARCHITECTURE.md). The ring, the HUD panel, the list view
 * and the AI guide all read this state and call these same actions — a guide tool
 * call dispatches exactly what a click does.
 *
 * Client components only. This is a module-level singleton, so on the server it
 * would be shared between every visitor's request. Server Components read
 * `content/projects.ts` directly and never import this file.
 */

export type ViewMode = "ring" | "list";

export type Filters = {
  skills: readonly string[];
  tags: readonly string[];
};

export type UiState = {
  activeProjectId: ProjectId | null;
  filters: Filters;
  viewMode: ViewMode;
};

export type UiActions = {
  /** Focus a project, or pass `null` to clear the focus. */
  focusProject: (id: ProjectId | null) => void;
  /** Replace one or both filter lists; a list you leave out is kept. */
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
};

/** `list` until the ring exists (Phase 3) — the list is the view that always works. */
export const initialUiState: UiState = {
  activeProjectId: null,
  filters: { skills: [], tags: [] },
  viewMode: "list",
};

const unique = (values: readonly string[]) => [...new Set(values)];

export const useUiStore = create<UiState & UiActions>()((set) => ({
  ...initialUiState,
  focusProject: (id) => set({ activeProjectId: id }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        skills: unique(filters.skills ?? state.filters.skills),
        tags: unique(filters.tags ?? state.filters.tags),
      },
    })),
  clearFilters: () => set({ filters: initialUiState.filters }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
