import { describe, expect, test } from "vitest";
import { isSoftwareRenderer } from "./webgl";

describe("isSoftwareRenderer", () => {
  test.each([
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "Google SwiftShader",
    "llvmpipe (LLVM 17.0.6, 256 bits)",
    "softpipe",
    "Apple Software Renderer",
    "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)",
  ])("CPU renderer: %s", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(true);
  });

  test.each([
    "ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)",
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "Adreno (TM) 740",
    "Apple GPU",
    "Mali-G78",
    // A browser that hides the name gets the benefit of the doubt: the frame-rate
    // monitor still steps the tier down if it turns out to be slow.
    "",
  ])("GPU or unknown: %s", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(false);
  });
});
