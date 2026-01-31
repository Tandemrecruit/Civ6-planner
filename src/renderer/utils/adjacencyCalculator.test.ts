import { describe, expect, it } from "vitest";

import type { Tile } from "../../types/model";
import { coordKey } from "../../types/model";

import { calculateAdjacency, getAdjacencyColor, getAdjacencyRating } from "./adjacencyCalculator";

function makeTile(partial: Partial<Tile> & Pick<Tile, "coord">): Tile {
  return {
    coord: partial.coord,
    terrain: partial.terrain ?? "grassland",
    modifier: partial.modifier,
    features: partial.features ?? [],
    resource: partial.resource,
    riverEdges: partial.riverEdges ?? [false, false, false, false, false, false],
    improvement: partial.improvement,
    district: partial.district,
    wonder: partial.wonder,
    owningCityId: partial.owningCityId,
    isPillaged: partial.isPillaged ?? false,
    plannedStates: partial.plannedStates ?? [],
    isLocked: partial.isLocked ?? false,
  };
}

describe("adjacencyCalculator", () => {
  it("getAdjacencyColor and getAdjacencyRating map bonus values", () => {
    expect(getAdjacencyColor(0)).toBe("#6b7280");
    expect(getAdjacencyColor(2)).toBe("#eab308");
    expect(getAdjacencyColor(4)).toBe("#f97316");
    expect(getAdjacencyColor(5)).toBe("#22c55e");

    expect(getAdjacencyRating(0)).toBe("Poor");
    expect(getAdjacencyRating(2)).toBe("Decent");
    expect(getAdjacencyRating(4)).toBe("Good");
    expect(getAdjacencyRating(5)).toBe("Excellent");
  });

  it("calculateAdjacency computes a simple Campus adjacency with district bonus", () => {
    const center = { q: 0, r: 0 } as const;

    // Neighbors (in the axial directions used by hexNeighbors):
    // E (1,0): mountain
    // NE (1,-1): mountain
    // NW (0,-1): rainforest
    // W (-1,0): city center (counts for district adjacency)
    // SW (-1,1): holy site (counts for district adjacency)
    const tiles = new Map<string, Tile>([
      [coordKey(center), makeTile({ coord: center })],
      [coordKey({ q: 1, r: 0 }), makeTile({ coord: { q: 1, r: 0 }, modifier: "mountain" })],
      [coordKey({ q: 1, r: -1 }), makeTile({ coord: { q: 1, r: -1 }, modifier: "mountain" })],
      [coordKey({ q: 0, r: -1 }), makeTile({ coord: { q: 0, r: -1 }, features: ["rainforest"] })],
      [coordKey({ q: -1, r: 0 }), makeTile({ coord: { q: -1, r: 0 }, district: "city_center" })],
      [coordKey({ q: -1, r: 1 }), makeTile({ coord: { q: -1, r: 1 }, district: "holy_site" })],
    ]);

    const result = calculateAdjacency(center, "campus", tiles);

    // Mountain (2) + Rainforest (1) + District adjacency (2 * 0.5 = 1) = 4
    expect(result.bonus).toBe(4);

    const bySource = new Map(result.breakdown.map((s) => [s.source, s]));
    expect(bySource.get("Mountain")?.totalBonus).toBe(2);
    expect(bySource.get("Rainforest")?.totalBonus).toBe(1);
    expect(bySource.get("District")?.totalBonus).toBe(1);
  });
});
