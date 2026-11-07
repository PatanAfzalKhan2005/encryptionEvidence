import { webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { computeSHA256 } from "@/lib/fx/format";
import { sha256Matches } from "@/lib/fx/verification";

afterEach(() => vi.unstubAllGlobals());

describe("SHA-256 image verification", () => {
  it("matches an unchanged image using its computed file hash", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const original = new NodeBlob(["original image file bytes"], { type: "image/png" });
    const originalHash = await computeSHA256(original);
    const uploadedHash = await computeSHA256(original);

    expect(sha256Matches(uploadedHash, originalHash)).toBe(true);
  });

  it("rejects an image whose file bytes were modified", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const original = new NodeBlob(["original image file bytes"], { type: "image/png" });
    const modified = new NodeBlob(["modified image file bytes"], { type: "image/png" });
    const originalHash = await computeSHA256(original);
    const uploadedHash = await computeSHA256(modified);

    expect(sha256Matches(uploadedHash, originalHash)).toBe(false);
  });

  it("rejects a missing or malformed stored original hash", () => {
    expect(() => sha256Matches("a".repeat(64), "")).toThrow(
      "The stored original image has a missing or invalid SHA-256 hash.",
    );
  });
});
