import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({
  // Avoid uuid's overloaded typings in test code by using a simple impl.
  v4: () => "uuid-1",
}));

import type { GameSetup } from "../types/model";
import { coordKey } from "../types/model";

import { useGameStore } from "./store";

const defaultSetup: GameSetup = {
  playerCiv: "korea",
  playerLeader: "seondeok",
  victoryType: "science",
  gameSpeed: "standard",
  dlc: {
    gatheringStorm: true,
    riseFall: true,
    dramaticAges: false,
    heroes: false,
    secretSocieties: false,
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

  // Reset store state between tests.
  useGameStore.getState().newGame(defaultSetup);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useGameStore actions", () => {
  it("newGame resets state and applies provided setup", () => {
    const s = useGameStore.getState();

    expect(s.setup).toEqual(defaultSetup);
    expect(s.tiles.size).toBe(0);
    expect(s.cities).toEqual([]);
    expect(s.completedTechs.size).toBe(0);
    expect(s.completedCivics.size).toBe(0);
    expect(s.techQueue).toEqual([]);
    expect(s.civicQueue).toEqual([]);
    expect(s.recommendations).toEqual([]);
  });

  it("addTile replaces the tiles Map and applies defaults", () => {
    const before = useGameStore.getState();
    const beforeTilesRef = before.tiles;

    const coord = { q: 2, r: -1 } as const;
    before.addTile({
      coord,
      terrain: "plains",
      features: [],
      riverEdges: [false, false, false, false, false, false],
    });

    const after = useGameStore.getState();
    expect(after.tiles).not.toBe(beforeTilesRef);

    const saved = after.tiles.get(coordKey(coord));
    expect(saved).toBeTruthy();
    expect(saved?.plannedStates).toEqual([]);
    expect(saved?.isLocked).toBe(false);
    expect(saved?.isPillaged).toBe(false);
  });

  it("updateTile updates an existing tile and is a no-op for missing tiles", () => {
    const coord = { q: 0, r: 0 } as const;
    useGameStore.getState().addTile({
      coord,
      terrain: "grassland",
      features: [],
      riverEdges: [false, false, false, false, false, false],
    });

    const beforeUpdate = useGameStore.getState().tiles;
    useGameStore.getState().updateTile(coord, { district: "campus" });

    const afterUpdate = useGameStore.getState().tiles;
    expect(afterUpdate).not.toBe(beforeUpdate);
    expect(afterUpdate.get(coordKey(coord))?.district).toBe("campus");

    const beforeMissing = useGameStore.getState().tiles;
    useGameStore.getState().updateTile({ q: 999, r: 999 }, { district: "holy_site" });
    const afterMissing = useGameStore.getState().tiles;
    expect(afterMissing).toBe(beforeMissing);
  });

  it("addToTechQueue generates deterministic ids via uuid mock", () => {
    useGameStore.getState().addToTechQueue("apprenticeship");

    const { techQueue } = useGameStore.getState();
    expect(techQueue).toHaveLength(1);
    expect(techQueue[0]).toEqual({ id: "uuid-1", techId: "apprenticeship", isLocked: false });
  });
});
