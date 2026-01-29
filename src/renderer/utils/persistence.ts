import {
  GameState,
  SerializedGameState,
  CURRENT_SCHEMA_VERSION,
  Tile,
} from "../../types/model";

/** Convert GameState to serializable format */
export const serialize = (state: GameState): SerializedGameState => {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    setup: state.setup,
    currentTurn: state.currentTurn,
    currentEra: state.currentEra,
    tiles: Array.from(state.tiles.entries()),
    cities: state.cities,
    completedTechs: Array.from(state.completedTechs),
    completedCivics: Array.from(state.completedCivics),
    currentTech: state.currentTech,
    currentCivic: state.currentCivic,
    techQueue: state.techQueue,
    civicQueue: state.civicQueue,
    policyLoadout: state.policyLoadout,
    gold: state.gold,
    faith: state.faith,
    strategicResources: Array.from(state.strategicResources.entries()),
    aiCivs: state.aiCivs,
    lastUpdated: state.lastUpdated.toISOString(),
  };
};

/** Convert serialized format back to GameState */
export const deserialize = (data: SerializedGameState): GameState => {
  // Handle schema migrations here as needed
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `Schema version mismatch: file is v${data.schemaVersion}, current is v${CURRENT_SCHEMA_VERSION}`
    );
    // Add migration logic here when schema changes
  }

  return {
    setup: data.setup,
    currentTurn: data.currentTurn,
    currentEra: data.currentEra,
    tiles: new Map(data.tiles as [string, Tile][]),
    cities: data.cities,
    completedTechs: new Set(data.completedTechs),
    completedCivics: new Set(data.completedCivics),
    currentTech: data.currentTech,
    currentCivic: data.currentCivic,
    techQueue: data.techQueue,
    civicQueue: data.civicQueue,
    policyLoadout: data.policyLoadout,
    gold: data.gold,
    faith: data.faith,
    strategicResources: new Map(data.strategicResources),
    aiCivs: data.aiCivs,
    lastUpdated: new Date(data.lastUpdated),
  };
};
