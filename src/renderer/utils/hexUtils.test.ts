import { describe, expect, it } from "vitest";

import { hexDistance, hexNeighbors, hexRound } from "./hexUtils";

describe("hexUtils", () => {
  it("hexRound rounds to the nearest hex", () => {
    expect(hexRound({ q: 1.3, r: 0.8 })).toEqual({ q: 1, r: 1 });
    expect(hexRound({ q: -0.4, r: 2.1 })).toEqual({ q: 0, r: 2 });
  });

  it("hexNeighbors returns 6 neighbors in clockwise order starting at East", () => {
    expect(hexNeighbors({ q: 0, r: 0 })).toEqual([
      { q: 1, r: 0 }, // E
      { q: 1, r: -1 }, // NE
      { q: 0, r: -1 }, // NW
      { q: -1, r: 0 }, // W
      { q: -1, r: 1 }, // SW
      { q: 0, r: 1 }, // SE
    ]);
  });

  it("hexDistance matches known examples", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
  });
});
