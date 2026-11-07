import { webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeSHA256 } from "@/lib/fx/format";

afterEach(() => vi.unstubAllGlobals());

describe("computeSHA256", () => {
  it("hashes the exact blob bytes and reports the real processing stages", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const stages: string[] = [];
    const hash = await computeSHA256(new NodeBlob(["abc"]), (stage) => stages.push(stage));

    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(stages).toEqual(["binary", "fingerprint", "generated"]);
  });
});
