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

/** Effects tier, set from measured frame rate (docs/DESIGN.md "Performance tiers"). */
export type Tier = "high" | "medium" | "low";

export type Filters = {
  skills: readonly string[];
  tags: readonly string[];
};

export type UiState = {
  /** The selected project: the one the detail panel shows. `null` = panel closed. */
  activeProjectId: ProjectId | null;
  /**
   * The project at the front of the ring. Arrow keys, drag, wheel and swipe move it
   * without opening the panel. `null` until the ring mounts and picks the first one.
   */
  frontProjectId: ProjectId | null;
  filters: Filters;
  viewMode: ViewMode;
  /** True once the 3D scene has loaded; the nav toggle only works from then on. */
  ringReady: boolean;
  tier: Tier;
  /**
   * How "busy" the core looks, 0 to 1. The render loop reads it with `getState()`
   * every frame; the guide raises it while answering (Phase 5).
   */
  coreActivity: number;
};

export type UiActions = {
  /**
   * Select a project (opens the detail panel), or pass `null` to clear the selection.
   * The ring follows: the selected project also becomes the front one.
   */
  focusProject: (id: ProjectId | null) => void;
  /**
   * Turn the ring to a project without selecting it. If a project is already
   * selected, the selection moves too, so the open panel always matches the front.
   */
  setFrontProject: (id: ProjectId) => void;
  /** Replace one or both filter lists; a list you leave out is kept. */
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setRingReady: (ready: boolean) => void;
  setTier: (tier: Tier) => void;
  setCoreActivity: (activity: number) => void;
};

/** `list` until the ring has loaded — the list is the view that always works. */
export const initialUiState: UiState = {
  activeProjectId: null,
  frontProjectId: null,
  filters: { skills: [], tags: [] },
  viewMode: "list",
  ringReady: false,
  tier: "high",
  coreActivity: 0,
};

const unique = (values: readonly string[]) => [...new Set(values)];

export const useUiStore = create<UiState & UiActions>()((set) => ({
  ...initialUiState,
  focusProject: (id) =>
    set(id === null ? { activeProjectId: null } : { activeProjectId: id, frontProjectId: id }),
  setFrontProject: (id) =>
    set((state) => ({
      frontProjectId: id,
      activeProjectId: state.activeProjectId === null ? null : id,
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        skills: unique(filters.skills ?? state.filters.skills),
        tags: unique(filters.tags ?? state.filters.tags),
      },
    })),
  clearFilters: () => set({ filters: initialUiState.filters }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setRingReady: (ready) => set({ ringReady: ready }),
  setTier: (tier) => set({ tier }),
  setCoreActivity: (activity) => set({ coreActivity: Math.min(1, Math.max(0, activity)) }),
}));
