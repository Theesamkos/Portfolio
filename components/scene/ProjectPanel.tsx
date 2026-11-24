"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Camera,
  type Group,
  type Material,
  type MeshBasicMaterial,
  type Object3D,
  Vector3,
} from "three";
import type { ProjectId } from "@/content/projects";
import { posterSvg } from "@/lib/poster-art";
import { facing, panelAngle } from "@/lib/ring";
import { useUiStore, type Tier } from "@/store/ui";
import { ease, ringInput, ringLabels, type IntroClock } from "./input";
import type { RingLayout } from "./layout";
import type { SceneTokens } from "./tokens";

/** Intro (docs/DESIGN.md): each panel rises 24px and fades in, 60ms after the last. */
const INTRO_STAGGER = 0.06;
const INTRO_DURATION = 0.45;
const INTRO_RISE = 0.24;

const GLASS_OPACITY = 0.7;
const FRONT_SCALE = 1.12;
const OTHER_OPACITY = 0.75;
const HOVER_LIFT = 0.06;
/** Drawn brighter than bloom's threshold (Effects.tsx) so the front edge glows. */
const EDGE_BOOST = 12;
/**
 * How far panels turn with the ring. 0 would keep every panel flat to the camera,
 * 1 would point each straight out from the center; in between, the side panels
 * stay readable, as in the reference (docs/DESIGN.md: "tilted to face the camera path").
 */
const TURN = 0.62;

/** Scratch vectors for projecting a label's corners; reused every frame. */
const topLeft = new Vector3();
const topRight = new Vector3();
const bottomLeft = new Vector3();

/** A point on the pane, in the pane's own space → screen pixels (written into `out`). */
function toScreen(
  out: Vector3,
  pane: Object3D,
  camera: Camera,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  pane.localToWorld(out.set(x, y, 0.03)).project(camera);
  out.set((out.x * 0.5 + 0.5) * width, (-out.y * 0.5 + 0.5) * height, 0);
}

export type PanelGeometry = {
  glass: BufferGeometry;
  edge: BufferGeometry;
  poster: BufferGeometry;
};

/**
 * One project on the ring: a rounded pane of glass, the project's art and an outline
 * that lights up when the panel is in front. Its title and `01 / 08` label are real
 * DOM text (rendered by RingScene, never baked into a texture); this component only
 * tells that DOM node where the pane is on screen.
 *
 * Everything that moves — scale, lift, opacity, glow — is eased in `useFrame` by
 * writing to refs. The component itself re-renders only when its props change.
 */
export function ProjectPanel({
  id,
  order,
  index,
  count,
  layout,
  tokens,
  tier,
  geometry,
  introRef,
  reducedMotion,
}: {
  id: ProjectId;
  order: number;
  index: number;
  count: number;
  layout: RingLayout;
  tokens: SceneTokens;
  tier: Tier;
  geometry: PanelGeometry;
  introRef: IntroClock;
  reducedMotion: boolean;
}) {
  const mount = useRef<Group>(null);
  const body = useRef<Group>(null);
  const frame = useRef<MeshBasicMaterial>(null);
  const glass = useRef<Material>(null);
  const edge = useRef<MeshBasicMaterial>(null);
  const art = useRef<MeshBasicMaterial>(null);
  const hovered = useRef(false);
  /** The element the hover cursor was set on, so it can be reset on unmount. */
  const cursorTarget = useRef<HTMLElement | null>(null);

  const angle = panelAngle(index, count);
  // Brighter than bloom's threshold only where there is bloom; on the low tier an
  // over-bright color would just clip toward white.
  const edgeColor = useMemo(
    () => new Color(tokens.accent).multiplyScalar(tier === "low" ? 1 : EDGE_BOOST),
    [tokens.accent, tier],
  );
  const poster = useMemo(() => {
    const svg = posterSvg(order, count, { accent: tokens.accent, glow: tokens.glow });
    const texture = new TextureLoader().load(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [order, count, tokens.accent, tokens.glow]);
  useEffect(() => () => poster.dispose(), [poster]);
  // A panel can unmount while hovered; don't leave the pointer cursor behind.
  useEffect(
    () => () => {
      if (cursorTarget.current) cursorTarget.current.style.cursor = "";
    },
    [],
  );

  useFrame((state, delta) => {
    const isFront = useUiStore.getState().frontProjectId === id;
    const toCamera = facing(index, count, ringInput.rotation);
    if (mount.current) {
      // The ring group has already turned this panel by `rotation`; undo that and
      // apply the softened turn instead.
      mount.current.rotation.y = TURN * Math.sin(angle + ringInput.rotation) - ringInput.rotation;
    }

    // Intro: 0 → 1 for this panel, starting `index` steps after the first.
    const introTime = (introRef.current - index * INTRO_STAGGER) / INTRO_DURATION;
    const appear = Math.min(1, Math.max(0, introTime));
    const rise = (1 - appear) ** 3 * -INTRO_RISE;

    // The carousel layout shows the front three; panels behind fade out entirely.
    const depthFade = layout.compact ? Math.min(1, Math.max(0, (toCamera - 0.2) / 0.3)) : 1;
    const dim = isFront ? 1 : OTHER_OPACITY;
    const visible = appear * depthFade;

    if (body.current) {
      const scale = ease(
        body.current.scale.x,
        isFront ? FRONT_SCALE : 1,
        tokens.ringRate,
        delta,
        reducedMotion,
      );
      body.current.scale.setScalar(scale);
      const lift = hovered.current ? HOVER_LIFT : 0;
      body.current.position.y =
        ease(body.current.position.y - rise, lift, tokens.hoverRate, delta, reducedMotion) + rise;
      body.current.visible = visible > 0.01;
    }
    if (glass.current) {
      glass.current.opacity = ease(
        glass.current.opacity,
        GLASS_OPACITY * dim * visible,
        tokens.ringRate,
        delta,
        reducedMotion || appear < 1,
      );
    }
    if (art.current) {
      art.current.opacity = ease(
        art.current.opacity,
        dim * visible,
        tokens.ringRate,
        delta,
        reducedMotion || appear < 1,
      );
    }
    if (frame.current) frame.current.opacity = 0.85 * dim * visible;
    if (edge.current) {
      const glow = isFront ? 1 : hovered.current ? 0.45 : 0;
      edge.current.opacity = ease(
        edge.current.opacity,
        glow * visible,
        tokens.hoverRate,
        delta,
        reducedMotion,
      );
    }
    const label = ringLabels[index];
    if (label && body.current) {
      // Panels at the back sit behind the core and the front panels; DOM text cannot
      // be hidden by WebGL, so their labels fade out instead. The text itself is not
      // dimmed with the glass: at 75% it would drop below AA contrast.
      const readable = Math.min(1, Math.max(0, (toCamera - 0.15) / 0.3));
      const opacity = (readable * visible).toFixed(2);
      if (label.style.opacity !== opacity) label.style.opacity = opacity;
      if (readable * visible > 0.01) {
        // Project three corners of the pane to screen pixels and map the label's box
        // onto them with a CSS matrix: the text then tilts and scales with the glass.
        const halfWidth = layout.panelWidth / 2;
        const halfHeight = layout.panelHeight / 2;
        const { width, height } = state.size;
        const pane = body.current;
        pane.updateWorldMatrix(true, false);
        toScreen(topLeft, pane, state.camera, -halfWidth, halfHeight, width, height);
        toScreen(topRight, pane, state.camera, halfWidth, halfHeight, width, height);
        toScreen(bottomLeft, pane, state.camera, -halfWidth, -halfHeight, width, height);
        const labelWidth = layout.labelWidth;
        const labelHeight = (labelWidth * layout.panelHeight) / layout.panelWidth;
        const a = (topRight.x - topLeft.x) / labelWidth;
        const b = (topRight.y - topLeft.y) / labelWidth;
        const c = (bottomLeft.x - topLeft.x) / labelHeight;
        const d = (bottomLeft.y - topLeft.y) / labelHeight;
        // Rounded, so a ring at rest produces the same string and no style write.
        const matrix = `matrix(${a.toFixed(4)},${b.toFixed(4)},${c.toFixed(4)},${d.toFixed(4)},${topLeft.x.toFixed(1)},${topLeft.y.toFixed(1)})`;
        if (label.style.transform !== matrix) label.style.transform = matrix;
        const order = String(Math.round(toCamera * 10));
        if (label.style.zIndex !== order) label.style.zIndex = order;
      }
    }
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    // `delta` is how far the pointer travelled between down and up: a drag, not a click.
    if (event.delta > 6) return;
    const { frontProjectId, focusProject, setFrontProject } = useUiStore.getState();
    if (frontProjectId === id) focusProject(id);
    else setFrontProject(id);
  };

  return (
    <group
      ref={mount}
      position={[Math.sin(angle) * layout.radius, 0, Math.cos(angle) * layout.radius]}
    >
      <group ref={body}>
        <mesh
          geometry={geometry.glass}
          onClick={onClick}
          onPointerOver={(event) => {
            event.stopPropagation();
            hovered.current = true;
            // On the element under the pointer: the stage's grab cursor would win
            // over one set on <body>.
            const target = event.nativeEvent.target;
            if (target instanceof HTMLElement) {
              cursorTarget.current = target;
              target.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            hovered.current = false;
            if (cursorTarget.current) cursorTarget.current.style.cursor = "";
          }}
        >
          {tier === "high" ? (
            <meshPhysicalMaterial
              ref={glass}
              color={tokens.white}
              transparent
              opacity={0}
              roughness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.1}
              envMapIntensity={1.1}
              depthWrite={false}
            />
          ) : (
            <meshStandardMaterial
              ref={glass}
              color={tokens.white}
              transparent
              opacity={0}
              roughness={0.25}
              depthWrite={false}
            />
          )}
        </mesh>

        {/* The pane's bright rim, on every panel. */}
        <mesh geometry={geometry.edge} position-z={0.021} raycast={() => null}>
          <meshBasicMaterial
            ref={frame}
            color={tokens.white}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
        {/* The blue edge glow: front panel, and faintly on hover. */}
        <mesh geometry={geometry.edge} position-z={0.022} raycast={() => null}>
          <meshBasicMaterial
            ref={edge}
            color={edgeColor}
            transparent
            opacity={0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        <mesh
          geometry={geometry.poster}
          position={[0, layout.panelHeight * 0.06, 0.024]}
          raycast={() => null}
        >
          <meshBasicMaterial ref={art} map={poster} transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
