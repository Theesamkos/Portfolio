import { describe, expect, test } from "vitest";
import {
  TAU,
  dampingFor,
  facing,
  indexAfterAction,
  indexAfterDrag,
  keyAction,
  nearestIndex,
  panelAngle,
  rotationFor,
  wrapAngle,
  wrapIndex,
} from "./ring";

const COUNT = 8;
const STEP = TAU / COUNT;

describe("ring math", () => {
  test("wrapIndex wraps both ways", () => {
    expect(wrapIndex(8, COUNT)).toBe(0);
    expect(wrapIndex(-1, COUNT)).toBe(7);
    expect(wrapIndex(3, COUNT)).toBe(3);
  });

  test("wrapAngle keeps angles in [-π, π)", () => {
    expect(wrapAngle(TAU + 0.5)).toBeCloseTo(0.5);
    expect(wrapAngle(-TAU - 0.5)).toBeCloseTo(-0.5);
    expect(wrapAngle(Math.PI)).toBeCloseTo(-Math.PI);
  });

  test("panels are spread evenly", () => {
    expect(panelAngle(0, COUNT)).toBe(0);
    expect(panelAngle(2, COUNT)).toBeCloseTo(Math.PI / 2);
  });

  test("rotationFor brings a panel to the front", () => {
    for (let index = 0; index < COUNT; index += 1) {
      const rotation = rotationFor(index, COUNT, 0);
      expect(facing(index, COUNT, rotation)).toBeCloseTo(1);
      expect(nearestIndex(rotation, COUNT)).toBe(index);
    }
  });

  test("rotationFor turns the short way round", () => {
    // From panel 0 to panel 7 is one step back, not seven steps forward.
    expect(rotationFor(7, COUNT, 0)).toBeCloseTo(STEP);
    expect(rotationFor(1, COUNT, 0)).toBeCloseTo(-STEP);
  });

  test("rotationFor never unwinds after many turns", () => {
    const current = -3 * TAU; // three full turns in
    expect(rotationFor(1, COUNT, current)).toBeCloseTo(current - STEP);
  });

  test("the next panel sits to the right of the front one", () => {
    // Positive x is screen-right; a panel at angle θ is at x = sin θ.
    expect(Math.sin(panelAngle(1, COUNT))).toBeGreaterThan(0);
    expect(Math.sin(panelAngle(7, COUNT))).toBeLessThan(0);
  });

  test("facing is 1 in front and -1 at the back", () => {
    expect(facing(0, COUNT, 0)).toBeCloseTo(1);
    expect(facing(4, COUNT, 0)).toBeCloseTo(-1);
  });
});

describe("drag", () => {
  test("snaps to the nearest panel", () => {
    expect(indexAfterDrag(0, -1.4 * STEP, -300, COUNT)).toBe(1);
    expect(indexAfterDrag(0, 2.6 * STEP, 500, COUNT)).toBe(5);
  });

  test("a short swipe still moves one step in its direction", () => {
    expect(indexAfterDrag(0, -0.3 * STEP, -60, COUNT)).toBe(1); // swipe left → next
    expect(indexAfterDrag(0, 0.3 * STEP, 60, COUNT)).toBe(7); // swipe right → previous
  });

  test("a tiny movement is not a swipe", () => {
    expect(indexAfterDrag(2, rotationFor(2, COUNT, 0) + 0.02, 5, COUNT)).toBe(2);
  });
});

describe("keyboard", () => {
  test("maps keys to actions", () => {
    expect(keyAction("ArrowLeft")).toBe("prev");
    expect(keyAction("ArrowRight")).toBe("next");
    expect(keyAction("Home")).toBe("first");
    expect(keyAction("End")).toBe("last");
    expect(keyAction("Enter")).toBe("select");
    expect(keyAction(" ")).toBe("select");
    expect(keyAction("a")).toBeNull();
    expect(keyAction("Tab")).toBeNull();
  });

  test("actions step around the ring and wrap", () => {
    expect(indexAfterAction("next", 7, COUNT)).toBe(0);
    expect(indexAfterAction("prev", 0, COUNT)).toBe(7);
    expect(indexAfterAction("first", 5, COUNT)).toBe(0);
    expect(indexAfterAction("last", 5, COUNT)).toBe(7);
    expect(indexAfterAction("select", 5, COUNT)).toBe(5);
  });
});

test("dampingFor: a move is about 99% done after the given time", () => {
  const lambda = dampingFor(0.6);
  expect(Math.exp(-lambda * 0.6)).toBeCloseTo(0.01);
});
