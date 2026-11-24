/** `01 / 08` — a project's place on the ring. A plain module: server and client both use it. */
export function projectPosition(order: number, total: number): string {
  return `${String(order).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}
