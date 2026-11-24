"use client";

import { useRef } from "react";
import { useUiStore } from "@/store/ui";
import { CameraRig } from "./CameraRig";
import { Core } from "./Core";
import { Effects } from "./Effects";
import type { RingLayout } from "./layout";
import { Lighting } from "./Lighting";
import { Platform } from "./Platform";
import { Ring, type RingProject } from "./Ring";
import type { SceneTokens } from "./tokens";

/** Everything inside the canvas. The tier decides how much of it is expensive. */
export function Scene({
  projects,
  layout,
  tokens,
  reducedMotion,
  skipIntro,
}: {
  projects: readonly RingProject[];
  layout: RingLayout;
  tokens: SceneTokens;
  reducedMotion: boolean;
  skipIntro: boolean;
}) {
  const tier = useUiStore((state) => state.tier);
  // A clock the render loop advances. Starting it "in the past" skips the intro.
  const introRef = useRef(skipIntro || reducedMotion ? 60 : 0);

  return (
    <>
      <Lighting tokens={tokens} />
      <Platform layout={layout} tokens={tokens} tier={tier} />
      <Core layout={layout} tokens={tokens} tier={tier} reducedMotion={reducedMotion} />
      <Ring
        projects={projects}
        layout={layout}
        tokens={tokens}
        tier={tier}
        introRef={introRef}
        reducedMotion={reducedMotion}
      />
      <CameraRig layout={layout} tokens={tokens} reducedMotion={reducedMotion} />
      <Effects tier={tier} />
    </>
  );
}
