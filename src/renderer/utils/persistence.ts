/**
 * @fileoverview Serialization utilities for game state persistence.
 *
 * This module handles conversion between the runtime GameState (which uses
 * Map and Set objects) and SerializedGameState (which uses arrays for JSON
 * compatibility). These functions are used when saving to and loading from disk.
 *
 * @module renderer/utils/persistence
 *
 * @example
 * // Save game state
 * const serialized = serialize(gameState);
 * await fs.writeFile('save.json', JSON.stringify(serialized));
 *
 * @example
 * // Load game state
 * const data = JSON.parse(await fs.readFile('save.json'));
 * const gameState = deserialize(data);
 */

import { GameState, SerializedGameState, CURRENT_SCHEMA_VERSION, Tile } from "../../types/model";

/**
 * Convert runtime GameState to a JSON-serializable format.
 *
 * Transforms Map and Set objects into arrays, and Date objects into
 * ISO strings. The resulting object can be safely passed to JSON.stringify().
 *
 * Type conversions:
 * - `Map<K, V>` → `Array<[K, V]>` (entries array)
 * - `Set<T>` → `Array<T>` (values array)
 * - `Date` → `string` (ISO format)
 *
 * @param state - The runtime game state to serialize
 * @returns A JSON-serializable representation of the game state
 *
 * @example
 * const gameState = useGameStore.getState();
 * const serialized = serialize(gameState);
 * const json = JSON.stringify(serialized, null, 2);
 *
 * @example
 * // Send to main process for saving
 * window.electronAPI.saveGame(serialize(state));
 *
 * @see deserialize - The inverse operation
 * @see SerializedGameState - The output format
 */
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

/**
 * Convert serialized JSON data back to runtime GameState.
 *
 * Restores Map and Set objects from their array representations, and
 * parses ISO date strings back to Date objects. Handles schema version
 * checking and will log warnings for version mismatches.
 *
 * Type conversions:
 * - `Array<[K, V]>` → `Map<K, V>`
 * - `Array<T>` → `Set<T>`
 * - `string` (ISO) → `Date`
 *
 * @param data - The serialized game state from JSON.parse()
 * @returns A runtime GameState object ready for use in the store
 *
 * @example
 * // Load from file
 * const json = await fs.readFile('save.json', 'utf8');
 * const data = JSON.parse(json) as SerializedGameState;
 * const gameState = deserialize(data);
 * useGameStore.getState().loadState(gameState);
 *
 * @example
 * // Receive from main process
 * window.electronAPI.onLoadGame((data) => {
 *   const state = deserialize(data);
 *   loadState(state);
 * });
 *
 * @remarks
 * Schema migrations should be handled in this function when breaking
 * changes are made to the data model. Check `data.schemaVersion` and
 * transform the data as needed before conversion.
 *
 * @see serialize - The inverse operation
 * @see GameState - The output format
 * @see CURRENT_SCHEMA_VERSION - Current schema version constant
 */
export const deserialize = (data: SerializedGameState): GameState => {
  // Handle schema migrations here as needed
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `Schema version mismatch: file is v${data.schemaVersion}, current is v${CURRENT_SCHEMA_VERSION}`,
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
