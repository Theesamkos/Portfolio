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
  type Texture,
  Vector3,
} from "three";
import type { ProjectId } from "@/content/projects";
import { facing, panelAngle } from "@/lib/ring";
import { useUiStore, type Tier } from "@/store/ui";
import { ease, ringInput, ringLabels, type IntroClock } from "./input";
import type { RingLayout } from "./layout";
import type { SceneTokens } from "./tokens";

/** Intro (docs/DESIGN.md): each panel rises 24px and fades in, 60ms after the last. */
const INTRO_STAGGER = 0.06;
const INTRO_DURATION = 0.45;
const INTRO_RISE = 0.24;

/** The pane itself. Below 1 so the core and the disc show through: frosted, not solid. */
const GLASS_OPACITY = 0.66;
const FRONT_SCALE = 1.12;
/** Side panels stay readable; the front one is brightest because it alone is at 1. */
const OTHER_OPACITY = 0.9;
const HOVER_LIFT = 0.06;
/**
 * The front edge is drawn brighter than bloom's threshold (Effects.tsx) so it glows —
 * but only just: far over the threshold the line turns into a hard saturated stroke.
 */
const EDGE_BOOST = 5;
/**
 * The low tier has no post-processing pass, so the browser blends the canvas into the
 * page itself and translucent layers come out heavier. The tint is thinned to match;
 * at full strength the pitch would sit on a band too dark for its contrast.
 */
const LOW_TIER_TINT = 0.4;
/** The glow texture is this much larger than the pane it sits behind. */
export const AURA_SCALE = 1.5;
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
  /** The pane's face, with 0–1 texture coordinates for the tint. */
  tint: BufferGeometry;
  edge: BufferGeometry;
  aura: BufferGeometry;
  poster: BufferGeometry;
};

/** Drawn once and shared by every panel (textures.ts). */
export type PanelTextures = { tint: Texture; aura: Texture };

/**
 * One project on the ring: a rounded pane of glass, the project's icon and an outline
 * that lights up when the panel is in front. Its title, pitch and `01 / 08` label are
 * real DOM text (rendered by RingScene, never baked into a texture); this component only
 * tells that DOM node where the pane is on screen.
 *
 * Everything that moves — scale, lift, opacity, glow — is eased in `useFrame` by
 * writing to refs. The component itself re-renders only when its props change.
 */
export function ProjectPanel({
  id,
  icon,
  index,
  count,
  layout,
  tokens,
  tier,
  geometry,
  textures,
  introRef,
  reducedMotion,
}: {
  id: ProjectId;
  /** Path of the project's icon under `public/`. */
  icon: string;
  index: number;
  count: number;
  layout: RingLayout;
  tokens: SceneTokens;
  tier: Tier;
  geometry: PanelGeometry;
  textures: PanelTextures;
  introRef: IntroClock;
  reducedMotion: boolean;
}) {
  const mount = useRef<Group>(null);
  const body = useRef<Group>(null);
  const frame = useRef<MeshBasicMaterial>(null);
  const glass = useRef<Material>(null);
  const tint = useRef<MeshBasicMaterial>(null);
  const edge = useRef<MeshBasicMaterial>(null);
  const aura = useRef<MeshBasicMaterial>(null);
  const art = useRef<MeshBasicMaterial>(null);
  const hovered = useRef(false);
  /** The element the hover cursor was set on, so it can be reset on unmount. */
  const cursorTarget = useRef<HTMLElement | null>(null);

  const angle = panelAngle(index, count);
  // The light glow blue, lifted over bloom's threshold where there is bloom. The low
  // tier has none, and an over-bright color there would only clip toward white — it
  // gets the plain accent, which still reads as a line on a light pane.
  const edgeColor = useMemo(
    () =>
      tier === "low" ? new Color(tokens.accent) : new Color(tokens.glow).multiplyScalar(EDGE_BOOST),
    [tokens.accent, tokens.glow, tier],
  );
  // The icon is an SVG file drawn as a texture. The browser rasterizes it once at the
  // size written in the file; a failed download just leaves the pane without art.
  const poster = useMemo(() => {
    const texture = new TextureLoader().load(icon);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [icon]);
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
    if (tint.current) tint.current.opacity = dim * visible * (tier === "low" ? LOW_TIER_TINT : 1);
    if (frame.current) frame.current.opacity = 0.9 * dim * visible;
    const glow = (isFront ? 1 : hovered.current ? 0.45 : 0) * visible;
    if (edge.current) {
      edge.current.opacity = ease(
        edge.current.opacity,
        glow,
        tokens.hoverRate,
        delta,
        reducedMotion,
      );
    }
    if (aura.current) {
      aura.current.opacity = ease(
        aura.current.opacity,
        glow,
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
        {/* The soft glow around the front panel (and faintly on hover). Behind the
            pane, so only the falloff outside its edge shows. */}
        <mesh geometry={geometry.aura} position-z={-0.01} raycast={() => null}>
          <meshBasicMaterial
            ref={aura}
            map={textures.aura}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

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
              color={tokens.glassTint}
              transparent
              opacity={0}
              roughness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.1}
              envMapIntensity={0.8}
              depthWrite={false}
            />
          ) : (
            <meshStandardMaterial
              ref={glass}
              color={tokens.glassTint}
              transparent
              opacity={0}
              roughness={0.25}
              depthWrite={false}
            />
          )}
        </mesh>

        {/* Frosting: clear at the top, bluer toward the bottom. */}
        <mesh geometry={geometry.tint} position-z={0.0205} raycast={() => null}>
          <meshBasicMaterial
            ref={tint}
            map={textures.tint}
            transparent
            opacity={0}
            depthWrite={false}
          />
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
          position={[0, layout.panelHeight * 0.1, 0.024]}
          raycast={() => null}
        >
          <meshBasicMaterial ref={art} map={poster} transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
