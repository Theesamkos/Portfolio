import { describe, expect, test } from "vitest";
import { SHEET_HEIGHT, snapAfterDrag } from "./sheet";

describe("snapAfterDrag", () => {
  test("a slow release settles on the nearest snap point", () => {
    expect(snapAfterDrag(SHEET_HEIGHT.half + 0.05, 0)).toBe("half");
    expect(snapAfterDrag(SHEET_HEIGHT.full - 0.05, 0)).toBe("full");
    expect(snapAfterDrag(0.74, 0)).toBe("full");
    expect(snapAfterDrag(0.73, 0)).toBe("half");
  });

  test("dragged well below half, it closes", () => {
    expect(snapAfterDrag(0.3, 0)).toBe("closed");
    expect(snapAfterDrag(0.4, 0)).toBe("half");
  });

  test("a flick carries it to the next snap point in its direction", () => {
    // Barely moved from half, but moving fast.
    expect(snapAfterDrag(SHEET_HEIGHT.half + 0.03, 1.5)).toBe("full");
    expect(snapAfterDrag(SHEET_HEIGHT.half - 0.03, -1.5)).toBe("closed");
    expect(snapAfterDrag(SHEET_HEIGHT.full - 0.03, -1.5)).toBe("half");
  });

  test("a flick down from full stops at half, not closed", () => {
    expect(snapAfterDrag(SHEET_HEIGHT.full - 0.1, -2)).toBe("half");
  });
});
