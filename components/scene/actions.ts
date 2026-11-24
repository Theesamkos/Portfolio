import type { ProjectId } from "@/content/projects";
import { indexAfterAction, keyAction, type RingAction } from "@/lib/ring";
import { useUiStore } from "@/store/ui";

/**
 * Applies a ring action to the store — the one place where "next", "previous" and
 * "select" become store calls. Buttons, keys and the wheel all come through here, so
 * they cannot drift apart. `ids` is the ring order.
 */
export function runRingAction(action: RingAction, ids: readonly ProjectId[]): void {
  const store = useUiStore.getState();
  const current = Math.max(0, store.frontProjectId ? ids.indexOf(store.frontProjectId) : 0);
  const target = ids[indexAfterAction(action, current, ids.length)];
  if (!target) return;
  // Turning the ring only changes what is in front; selecting opens the detail panel.
  if (action === "select") store.focusProject(target);
  else store.setFrontProject(target);
}

/** Handles a key press on the ring. Returns true if the key meant something. */
export function runRingKey(key: string, ids: readonly ProjectId[]): boolean {
  const action = keyAction(key);
  if (!action) return false;
  runRingAction(action, ids);
  return true;
}
