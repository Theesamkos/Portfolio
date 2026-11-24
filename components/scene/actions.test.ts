import { beforeEach, describe, expect, test } from "vitest";
import type { ProjectId } from "@/content/projects";
import { initialUiState, useUiStore } from "@/store/ui";
import { runRingAction, runRingKey } from "./actions";

const ids: readonly ProjectId[] = [
  "software-factory",
  "math-tiles",
  "chatbridge",
  "legacylens",
  "sentinel-six",
  "autonomous-ad-engine",
  "servicecore",
  "acme-invoice-agent",
];
const state = () => useUiStore.getState();

beforeEach(() => {
  useUiStore.setState({ ...initialUiState, frontProjectId: "software-factory" });
});

describe("ring keyboard → store", () => {
  test("ArrowRight and ArrowLeft move the front project without selecting it", () => {
    expect(runRingKey("ArrowRight", ids)).toBe(true);
    expect(state().frontProjectId).toBe("math-tiles");
    expect(state().activeProjectId).toBeNull();

    runRingKey("ArrowLeft", ids);
    runRingKey("ArrowLeft", ids);
    expect(state().frontProjectId).toBe("acme-invoice-agent");
    expect(state().activeProjectId).toBeNull();
  });

  test("Enter calls focusProject on the front project", () => {
    runRingKey("ArrowRight", ids);
    runRingKey("Enter", ids);
    expect(state().activeProjectId).toBe("math-tiles");
    expect(state().frontProjectId).toBe("math-tiles");
  });

  test("Space selects too; Home and End jump to the ends", () => {
    runRingKey("End", ids);
    expect(state().frontProjectId).toBe("acme-invoice-agent");
    runRingKey("Home", ids);
    expect(state().frontProjectId).toBe("software-factory");
    runRingKey(" ", ids);
    expect(state().activeProjectId).toBe("software-factory");
  });

  test("with the panel open, arrows move the selection along with the ring", () => {
    runRingKey("Enter", ids);
    runRingKey("ArrowRight", ids);
    expect(state().activeProjectId).toBe("math-tiles");
  });

  test("other keys are ignored", () => {
    expect(runRingKey("Tab", ids)).toBe(false);
    expect(runRingKey("a", ids)).toBe(false);
    expect(state().frontProjectId).toBe("software-factory");
  });

  test("before the ring has picked a front project, actions start from the first", () => {
    useUiStore.setState({ frontProjectId: null });
    runRingAction("next", ids);
    expect(state().frontProjectId).toBe("math-tiles");
  });
});
