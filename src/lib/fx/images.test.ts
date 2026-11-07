import { describe, expect, it } from "vitest";
import { analyzePixelData } from "@/lib/fx/images";

describe("visual image analysis", () => {
  it("scores identical pixels as a complete visual match", () => {
    const pixels = new Uint8ClampedArray([40, 90, 120, 255, 20, 40, 60, 255]);
    expect(analyzePixelData(pixels, pixels, 2, 1)).toEqual({
      similarity: 100,
      differencePercent: 0,
    });
  });

  it("separates approximate similarity from exact pixel differences", () => {
    const original = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
    const changed = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const result = analyzePixelData(original, changed, 2, 1);
    expect(result.differencePercent).toBe(50);
    expect(result.similarity).toBeLessThan(100);
    expect(result.similarity).toBeGreaterThanOrEqual(0);
  });
});
