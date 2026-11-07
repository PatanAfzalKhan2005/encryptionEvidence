export interface ImageDimensions {
  width: number;
  height: number;
}

export async function readImageDimensions(file: Blob): Promise<ImageDimensions> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface VisualAnalysis {
  similarity: number;
  differencePercent: number;
  summary: string;
  base: string;
  heatmap: string;
  bounds: { x: number; y: number; width: number; height: number } | null;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Windowed SSIM (11x11 neighborhoods, sampled every 4 pixels) plus a pixel-change ratio. */
export function analyzePixelData(
  original: Uint8ClampedArray,
  candidate: Uint8ClampedArray,
  width: number,
  height: number,
): Omit<VisualAnalysis, "base" | "heatmap" | "bounds" | "summary"> {
  const n = Math.min(original.length, candidate.length) / 4;
  if (!n) return { similarity: 0, differencePercent: 0 };
  let changed = 0;
  const lumA = new Float64Array(n),
    lumB = new Float64Array(n);
  let index = 0;
  for (let p = 0; p < n * 4; p += 4) {
    const a = luminance(original[p], original[p + 1], original[p + 2]);
    const b = luminance(candidate[p], candidate[p + 1], candidate[p + 2]);
    lumA[index] = a;
    lumB[index] = b;
    if (
      (Math.abs(original[p] - candidate[p]) +
        Math.abs(original[p + 1] - candidate[p + 1]) +
        Math.abs(original[p + 2] - candidate[p + 2])) /
        3 >
      28
    )
      changed++;
    index++;
  }
  const radius = 5;
  const stride = 4;
  let scoreSum = 0,
    windows = 0;
  const c1 = 6.5025,
    c2 = 58.5225;
  for (let cy = 0; cy < height; cy += stride) {
    for (let cx = 0; cx < width; cx += stride) {
      const x0 = Math.max(0, cx - radius),
        x1 = Math.min(width - 1, cx + radius);
      const y0 = Math.max(0, cy - radius),
        y1 = Math.min(height - 1, cy + radius);
      let count = 0,
        localA = 0,
        localB = 0;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const i = y * width + x;
          localA += lumA[i];
          localB += lumB[i];
          count++;
        }
      const ma = localA / count,
        mb = localB / count;
      let va = 0,
        vb = 0,
        cov = 0;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const i = y * width + x,
            da = lumA[i] - ma,
            db = lumB[i] - mb;
          va += da * da;
          vb += db * db;
          cov += da * db;
        }
      const divisor = Math.max(1, count - 1);
      va /= divisor;
      vb /= divisor;
      cov /= divisor;
      scoreSum +=
        ((2 * ma * mb + c1) * (2 * cov + c2)) / ((ma * ma + mb * mb + c1) * (va + vb + c2));
      windows++;
    }
  }
  return {
    similarity: Math.max(0, Math.min(100, (scoreSum / windows) * 100)),
    differencePercent: (changed / n) * 100,
  };
}

export async function analyzeImageBlobs(original: Blob, candidate: Blob): Promise<VisualAnalysis> {
  if (typeof createImageBitmap !== "function")
    throw new Error("Image analysis is unavailable in this browser.");
  const [a, b] = await Promise.all([createImageBitmap(original), createImageBitmap(candidate)]);
  try {
    const scale = Math.min(640 / Math.max(a.width, b.width), 640 / Math.max(a.height, b.height), 1);
    const width = Math.max(1, Math.round(Math.max(a.width, b.width) * scale));
    const height = Math.max(1, Math.round(Math.max(a.height, b.height) * scale));
    const before = document.createElement("canvas");
    before.width = width;
    before.height = height;
    const ctx = before.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas image analysis is unavailable.");
    ctx.drawImage(a, 0, 0, width, height);
    const left = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(b, 0, 0, width, height);
    const right = ctx.getImageData(0, 0, width, height).data;
    const metrics = analyzePixelData(left, right, width, height);
    const mask = ctx.createImageData(width, height);
    let minX = width,
      minY = height,
      maxX = -1,
      maxY = -1;
    for (let p = 0; p < left.length; p += 4) {
      const delta =
        (Math.abs(left[p] - right[p]) +
          Math.abs(left[p + 1] - right[p + 1]) +
          Math.abs(left[p + 2] - right[p + 2])) /
        3;
      if (delta <= 14) continue;
      const px = (p / 4) % width,
        py = Math.floor(p / 4 / width);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
      if (delta < 42) {
        mask.data[p] = 255;
        mask.data[p + 1] = 200;
        mask.data[p + 2] = 45;
      } else {
        mask.data[p] = 239;
        mask.data[p + 1] = 55;
        mask.data[p + 2] = 67;
      }
      mask.data[p + 3] = Math.min(220, 72 + delta);
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(a, 0, 0, width, height);
    const base = before.toDataURL("image/png");
    ctx.putImageData(mask, 0, 0);
    const bounds =
      maxX >= 0
        ? { x: minX, y: minY, width: Math.max(2, maxX - minX), height: Math.max(2, maxY - minY) }
        : null;
    if (bounds) {
      ctx.strokeStyle = "#f13c46";
      ctx.lineWidth = Math.max(2, Math.round(width / 320));
      ctx.setLineDash([7, 4]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    const summary =
      metrics.differencePercent < 0.1
        ? "No substantial pixel changes were detected after resizing both images to a common comparison frame."
        : `Approx. ${metrics.differencePercent.toFixed(1)}% of pixels exceed the colour-difference threshold after alignment.`;
    return { ...metrics, base, heatmap: before.toDataURL("image/png"), bounds, summary };
  } finally {
    a.close();
    b.close();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
