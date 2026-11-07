import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LandingLaptop from "@/components/fx/LandingLaptop";

describe("LandingLaptop server rendering", () => {
  it("renders the same demonstration fingerprint on each server render", () => {
    const firstRender = renderToString(<LandingLaptop />);
    const secondRender = renderToString(<LandingLaptop />);

    expect(firstRender).toBe(secondRender);
    expect(firstRender).toContain("e3b0c44298fc1c149afbf4c899");
  });
});
