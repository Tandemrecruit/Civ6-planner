import { describe, expect, it, vi } from "vitest";

import type { GameState, SerializedGameState, Tile } from "../../types/model";
import { CURRENT_SCHEMA_VERSION, coordKey } from "../../types/model";

import { deserialize, serialize } from "./persistence";

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

function makeState(overrides: Partial<GameState> = {}): GameState {
  const setup: GameState["setup"] = {
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

  const tileCoord = { q: 0, r: 0 } as const;
  const tile = makeTile({ coord: tileCoord, terrain: "grassland", features: [] });
  const tiles = new Map<string, Tile>([[coordKey(tileCoord), tile]]);

  return {
    setup,
    currentTurn: 25,
    currentEra: "classical",
    tiles,
    cities: [],
    completedTechs: new Set(["writing"]),
    completedCivics: new Set(["foreign_trade"]),
    currentTech: { techId: "apprenticeship", progress: 10, turnsRemaining: 5 },
    currentCivic: undefined,
    techQueue: [{ id: "queue-tech-1", techId: "apprenticeship", isLocked: false }],
    civicQueue: [{ id: "queue-civic-1", civicId: "state_workforce", isLocked: true }],
    policyLoadout: {
      government: "chiefdom",
      slots: [{ slotType: "military" }, { slotType: "economic" }],
    },
    gold: 123,
    faith: 45,
    strategicResources: new Map([
      ["iron", 2],
      ["horses", 0],
    ]),
    aiCivs: [],
    lastUpdated: new Date("2020-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("persistence", () => {
  it("serialize converts Maps/Sets/Dates into JSON-safe structures", () => {
    const state = makeState();

    const serialized = serialize(state);

    expect(serialized.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(serialized.lastUpdated).toBe("2020-01-01T00:00:00.000Z");

    expect(Array.isArray(serialized.tiles)).toBe(true);
    expect(Array.isArray(serialized.completedTechs)).toBe(true);
    expect(Array.isArray(serialized.completedCivics)).toBe(true);
    expect(Array.isArray(serialized.strategicResources)).toBe(true);
  });

  it("deserialize(serialize(state)) round-trips Maps/Sets and restores Date", () => {
    const state = makeState();

    const roundTripped = deserialize(serialize(state));

    expect(roundTripped.tiles).toBeInstanceOf(Map);
    expect(roundTripped.tiles.size).toBe(1);

    expect(roundTripped.completedTechs).toBeInstanceOf(Set);
    expect(roundTripped.completedTechs.has("writing")).toBe(true);

    expect(roundTripped.completedCivics).toBeInstanceOf(Set);
    expect(roundTripped.completedCivics.has("foreign_trade")).toBe(true);

    expect(roundTripped.strategicResources).toBeInstanceOf(Map);
    expect(roundTripped.strategicResources.get("iron")).toBe(2);

    expect(roundTripped.lastUpdated).toBeInstanceOf(Date);
    expect(roundTripped.lastUpdated.toISOString()).toBe("2020-01-01T00:00:00.000Z");
  });

  it("deserialize warns on schema version mismatch", () => {
    const state = makeState();
    const serialized = serialize(state);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const mismatched: SerializedGameState = {
      ...serialized,
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
    };
    deserialize(mismatched);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("Schema version mismatch");

    warnSpy.mockRestore();
  });
});
