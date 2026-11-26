"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ArrowLeftIcon, ArrowRightIcon, CheckCheckIcon, CloseIcon } from "@/components/ui/icons";
import { MonoLabel } from "@/components/ui/MonoLabel";
import type { FeaturedProject } from "@/content/projects";
import { projectPosition } from "@/lib/project-position";
import { SHEET_HEIGHT, snapAfterDrag, type SheetSnap } from "@/lib/sheet";
import { useUiStore } from "@/store/ui";
import { ProjectLinks } from "./ProjectLinks";
import { StatusChip, VisibilityChip } from "./StatusChip";

/** Matches Tailwind's `lg` breakpoint: a side panel from here up, a bottom sheet below. */
const DESKTOP = "(min-width: 1024px)";

/**
 * The project detail panel (docs/DESIGN.md). It shows whichever project the store
 * says is active, so a card click, the ring (Phase 3) and the AI guide (Phase 5) all
 * open it the same way: by calling `focusProject`.
 *
 * It is a native `<dialog>`. Layout: a panel on the right from 1024px, a bottom
 * sheet below. Mode:
 * - Modal (`showModal()`) in the list view and on every small screen. The browser
 *   supplies the backdrop, traps focus and closes on Esc — so nothing behind the
 *   panel can take focus or be covered while still clickable.
 * - Non-modal (`show()`) only in the ring view on desktop, where the ring behind it
 *   has to stay draggable.
 * Either way focus returns to the element that opened it on close.
 *
 * As a sheet it has two heights (lib/sheet.ts): it opens at half, and the handle at
 * the top takes it to full — by dragging it, or by pressing it like any button.
 * Dragging down from half closes it.
 *
 * `projects` comes in as a prop from the Server Component page: importing
 * `content/projects.ts` here would ship its Zod schema to the browser.
 */
export function DetailPanel({ projects }: { projects: readonly FeaturedProject[] }) {
  const activeProjectId = useUiStore((state) => state.activeProjectId);
  const viewMode = useUiStore((state) => state.viewMode);
  const focusProject = useUiStore((state) => state.focusProject);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [snap, setSnap] = useState<SheetSnap>("half");
  /** The drag in progress. A ref: it changes on every pointer move and renders nothing. */
  const drag = useRef<{
    startY: number;
    startHeight: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);

  const index = projects.findIndex((project) => project.id === activeProjectId);
  const project = index === -1 ? null : projects[index];
  const isOpen = project !== null;

  // A sheet always opens at half height, whatever it was left at. Resetting state when
  // a value changes is done during render, not in an effect: React re-renders at once
  // with the new state, and nothing is painted with the stale one.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setSnap("half");
  }

  // Each time the project changes: remember what selected it (so closing returns
  // focus there, not to whatever opened the panel first) and start at the top.
  // This effect must stay above the one that opens the dialog: opening moves focus
  // into the dialog, and after that the opener can no longer be read.
  useEffect(() => {
    if (activeProjectId === null) return;
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !dialogRef.current?.contains(active)
    ) {
      openerRef.current = active;
    }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeProjectId]);

  // The store is the source of truth; this keeps the <dialog> element in step with it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      if (viewMode === "ring" && window.matchMedia(DESKTOP).matches) dialog.show();
      else dialog.showModal();
      // Left alone, Chrome puts focus on the scroll area, whose outline is clipped.
      // `preventScroll`: moving focus must never scroll the sheet or the page under it.
      closeRef.current?.focus({ preventScroll: true });
      // The reset above ran while the dialog was still closed, when it has no box to
      // scroll. Do it again now that it is laid out, so it always opens at the top.
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (!isOpen) {
      if (dialog.open) dialog.close();
      // Browsers only hand focus back reliably for modal dialogs, so do it here.
      openerRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    }
  }, [isOpen, viewMode]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => focusProject(null);
    // A non-modal dialog does not close on Esc by itself.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // Crossing the breakpoint would leave it open in the wrong mode; close instead.
    const media = window.matchMedia(DESKTOP);
    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", close);
    };
  }, [isOpen, focusProject]);

  const step = (offset: number) => {
    const next = projects[(index + offset + projects.length) % projects.length];
    if (next) focusProject(next.id);
  };

  // Dragging the handle: the sheet's height follows the finger, written straight to
  // the element's style — no state, so no re-render per move. Pointer capture keeps
  // the moves coming to the handle even when the finger leaves it.
  const onHandleDown = (event: PointerEvent<HTMLButtonElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      startHeight: dialog.getBoundingClientRect().height,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  };
  const onHandleMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dialog = dialogRef.current;
    const state = drag.current;
    if (!dialog || !state) return;
    const travelled = state.startY - event.clientY;
    if (!state.moved && Math.abs(travelled) < 6) return;
    state.moved = true;
    const elapsed = event.timeStamp - state.lastTime;
    if (elapsed > 0) {
      state.velocity = ((state.lastY - event.clientY) / elapsed) * 1000;
      state.lastY = event.clientY;
      state.lastTime = event.timeStamp;
    }
    const height = Math.min(window.innerHeight * SHEET_HEIGHT.full, state.startHeight + travelled);
    dialog.style.transition = "none";
    dialog.style.height = `${Math.max(0, height)}px`;
  };
  const onHandleUp = () => {
    const dialog = dialogRef.current;
    const state = drag.current;
    if (!dialog || !state?.moved) return;
    const viewport = window.innerHeight;
    const target = snapAfterDrag(
      dialog.getBoundingClientRect().height / viewport,
      state.velocity / viewport,
    );
    // Hand the height back to CSS, which animates to the snap point.
    dialog.style.transition = "";
    dialog.style.height = "";
    if (target === "closed") focusProject(null);
    else setSnap(target);
  };
  // The click that ends a drag is not a press; a press (or Enter / Space) toggles.
  const onHandleClick = () => {
    const dragged = drag.current?.moved ?? false;
    drag.current = null;
    if (!dragged) setSnap((current) => (current === "half" ? "full" : "half"));
  };

  return (
    <dialog
      ref={dialogRef}
      data-snap={snap}
      style={{ "--sheet-height": `${SHEET_HEIGHT[snap] * 100}dvh` } as CSSProperties}
      aria-labelledby="detail-panel-title"
      // Esc on a modal closes the element itself; tell the store. The event arrives a
      // moment after the close, so if the panel was reopened in between it is stale
      // and must not close the new one.
      onClose={(event) => {
        if (!event.currentTarget.open) focusProject(null);
      }}
      // A click outside the panel's box is a click on the modal backdrop.
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        // Keyboard-activated clicks report 0,0; they are never backdrop clicks.
        if (!inside && event.detail > 0) focusProject(null);
      }}
      className="detail-panel glass-strong glass-blur text-ink rounded-t-sheet duration-panel backdrop:bg-ink/30 lg:rounded-sheet lg:backdrop:bg-ink/10 fixed inset-x-0 top-auto bottom-0 z-40 m-0 w-full max-w-none flex-col overflow-hidden rounded-b-none p-0 transition-[opacity,translate,height] ease-out open:flex max-lg:h-(--sheet-height) lg:inset-x-auto lg:top-24 lg:bottom-auto lg:h-[min(46rem,calc(100dvh-7rem))] lg:max-h-none lg:w-120 starting:translate-y-4 starting:opacity-0"
    >
      {project ? (
        <>
          {/* The sheet's handle. A real button: drag it, or press it to switch between
              half and full height. `touch-none` keeps the browser from scrolling the
              page while it is dragged. */}
          <button
            type="button"
            aria-expanded={snap === "full"}
            aria-label={snap === "full" ? "Collapse project details" : "Expand project details"}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onClick={onHandleClick}
            className="group flex h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center -outline-offset-4 active:cursor-grabbing lg:hidden"
          >
            <span className="bg-ink-dim/40 group-hover:bg-ink-dim/70 duration-hover h-1.5 w-10 rounded-full transition-colors" />
          </button>

          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-6 pt-2 lg:p-8 lg:pt-6"
          >
            <div className="flex items-center justify-between gap-4">
              <MonoLabel>Project {projectPosition(project.order, projects.length)}</MonoLabel>
              <button
                type="button"
                aria-label="Close project details"
                ref={closeRef}
                onClick={() => focusProject(null)}
                className="text-ink hover:bg-accent-soft duration-hover -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <h2 id="detail-panel-title" className="text-xl font-extrabold lg:text-2xl">
                {project.title}
              </h2>
              <p className="text-ink-dim text-lg">{project.pitch}</p>
            </div>

            <section aria-labelledby="detail-panel-impact" className="border-line border-t pt-5">
              <h3 id="detail-panel-impact" className="text-accent-ink text-lg font-semibold">
                Impact
              </h3>
              <ul role="list" className="mt-3 flex flex-col gap-2">
                {project.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-base">
                    <CheckCheckIcon className="text-accent mt-0.5 size-5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="detail-panel-skills" className="border-line border-t pt-5">
              <h3 id="detail-panel-skills" className="text-accent-ink text-lg font-semibold">
                Skills
              </h3>
              <ul role="list" className="mt-3 flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <Chip key={skill} as="li">
                    {skill}
                  </Chip>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={project.status} />
              <VisibilityChip visibility={project.visibility} />
            </div>

            {project.team ? (
              <p className="text-ink-dim text-sm">
                Team project with the {project.team.name}. Sam&apos;s role: {project.team.role}.
              </p>
            ) : null}

            <ProjectLinks project={project} primaryDemo />
          </div>

          {/* Pinned, so Previous / Next stay under the pointer from project to project. */}
          <div className="border-line flex shrink-0 justify-between gap-3 border-t px-6 py-4 lg:px-8">
            <Button variant="secondary" icon={<ArrowLeftIcon />} onClick={() => step(-1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowRightIcon />}
              iconPosition="end"
              onClick={() => step(1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
