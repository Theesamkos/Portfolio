"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/ui";

/**
 * Development only: the current effects tier and the measured frame rate, so tier
 * changes can be watched while throttling the machine. Never rendered in production.
 */
export function TierReadout() {
  const tier = useUiStore((state) => state.tier);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let since = performance.now();
    let handle = requestAnimationFrame(function count(now) {
      frames += 1;
      if (now - since >= 1000) {
        setFps(Math.round((frames * 1000) / (now - since)));
        frames = 0;
        since = now;
      }
      handle = requestAnimationFrame(count);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <p className="tracking-readout glass text-ink-dim pointer-events-none absolute top-2 left-2 z-20 rounded-full px-3 py-1 font-mono text-xs uppercase">
      tier {tier} · {fps} fps
    </p>
  );
}
