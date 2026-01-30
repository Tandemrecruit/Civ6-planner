/**
 * @fileoverview Zustand store for managing global game state.
 *
 * This module provides a centralized state management solution using Zustand.
 * It extends the core GameState with actions for all game operations including
 * tile management, city management, research queues, and recommendations.
 *
 * @module renderer/store
 *
 * @example
 * // Access state and actions in a React component
 * const { tiles, cities, addTile } = useGameStore();
 *
 * @example
 * // Subscribe to specific state slices
 * const currentTurn = useGameStore((state) => state.currentTurn);
 */

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  GameState,
  GameSetup,
  Tile,
  City,
  HexCoord,
  coordKey,
  BuildQueueItem,
  TilePlannedState,
  Recommendation,
  AICiv,
  ThreatLevel,
  PolicyLoadout,
} from "../types/model";

/**
 * Combined game state and actions interface.
 *
 * Extends {@link GameState} with:
 * - Transient state (recommendations) that isn't persisted
 * - Action methods for all state mutations
 *
 * All mutations are immutable - actions return new state objects rather than
 * modifying existing state. This ensures React components re-render correctly.
 *
 * @example
 * // Using the store hook
 * const Component = () => {
 *   const { tiles, addTile, updateTile } = useGameStore();
 *   // ...
 * };
 */
interface GameStore extends GameState {
  // ============================================================================
  // TRANSIENT STATE (not persisted)
  // ============================================================================

  /**
   * AI-generated recommendations for the player.
   * These are computed at runtime and not saved to disk.
   */
  recommendations: Recommendation[];

  // ============================================================================
  // GAME LIFECYCLE ACTIONS
  // ============================================================================

  /**
   * Initialize a new game with the given setup configuration.
   * Resets all state to defaults while preserving the setup.
   *
   * @param setup - Initial game configuration (civ, leader, victory type, etc.)
   *
   * @example
   * newGame({
   *   playerCiv: "korea",
   *   playerLeader: "seondeok",
   *   victoryType: "science",
   *   gameSpeed: "standard",
   *   dlc: { gatheringStorm: true, riseFall: true, ... }
   * });
   */
  newGame: (setup: GameSetup) => void;

  /**
   * Load a previously saved game state.
   * Replaces all current state with the loaded state.
   *
   * @param state - Complete game state to restore
   */
  loadState: (state: GameState) => void;

  /**
   * Advance the game to a new turn number.
   * Updates the currentTurn and lastUpdated timestamp.
   *
   * @param newTurn - The new turn number (must be > currentTurn)
   *
   * @example
   * advanceTurn(25); // Jump to turn 25
   */
  advanceTurn: (newTurn: number) => void;

  // ============================================================================
  // TILE ACTIONS
  // ============================================================================

  /**
   * Add a new tile to the map.
   * Automatically initializes plannedStates, isLocked, and isPillaged.
   *
   * @param tile - Tile data without auto-generated fields
   *
   * @example
   * addTile({
   *   coord: { q: 3, r: -1 },
   *   terrain: "grassland",
   *   modifier: "hills",
   *   features: ["woods"],
   *   riverEdges: [false, false, false, false, false, false]
   * });
   */
  addTile: (tile: Omit<Tile, "plannedStates" | "isLocked" | "isPillaged">) => void;

  /**
   * Update properties of an existing tile.
   *
   * @param coord - Coordinates of the tile to update
   * @param updates - Partial tile object with fields to update
   *
   * @example
   * updateTile({ q: 3, r: -1 }, { district: "campus", improvement: undefined });
   */
  updateTile: (coord: HexCoord, updates: Partial<Tile>) => void;

  /**
   * Add a planned future state to a tile's timeline.
   *
   * @param coord - Coordinates of the tile
   * @param plan - Plan data (id is auto-generated)
   *
   * @example
   * addTilePlan({ q: 3, r: -1 }, {
   *   trigger: { type: "tech", techId: "apprenticeship" },
   *   action: { type: "place_district", district: "industrial_zone" },
   *   rationale: "+4 adjacency from mines"
   * });
   */
  addTilePlan: (coord: HexCoord, plan: Omit<TilePlannedState, "id">) => void;

  /**
   * Remove a planned state from a tile.
   *
   * @param coord - Coordinates of the tile
   * @param planId - ID of the plan to remove
   */
  removeTilePlan: (coord: HexCoord, planId: string) => void;

  /**
   * Lock or unlock a tile to prevent/allow recommendation changes.
   *
   * @param coord - Coordinates of the tile
   * @param locked - Whether the tile should be locked
   */
  lockTile: (coord: HexCoord, locked: boolean) => void;

  // ============================================================================
  // CITY ACTIONS
  // ============================================================================

  /**
   * Add a new city to the game.
   * Automatically generates id and initializes buildQueue and plannedDistricts.
   *
   * @param city - City data without auto-generated fields
   *
   * @example
   * addCity({
   *   name: "Seoul",
   *   location: { q: 0, r: 0 },
   *   population: 1,
   *   housingCap: 3,
   *   amenities: 0,
   *   ownedTiles: [{ q: 0, r: 0 }],
   *   workedTiles: [{ q: 0, r: 0 }],
   *   districts: [{ type: "city_center", tile: { q: 0, r: 0 }, buildings: [], isPillaged: false }]
   * });
   */
  addCity: (city: Omit<City, "id" | "buildQueue" | "plannedDistricts">) => void;

  /**
   * Update properties of an existing city.
   *
   * @param cityId - ID of the city to update
   * @param updates - Partial city object with fields to update
   */
  updateCity: (cityId: string, updates: Partial<City>) => void;

  /**
   * Add an item to a city's build queue.
   *
   * @param cityId - ID of the city
   * @param item - Build queue item (id and isLocked are auto-set)
   */
  addToBuildQueue: (cityId: string, item: Omit<BuildQueueItem, "id" | "isLocked">) => void;

  /**
   * Remove an item from a city's build queue.
   *
   * @param cityId - ID of the city
   * @param itemId - ID of the queue item to remove
   */
  removeFromBuildQueue: (cityId: string, itemId: string) => void;

  /**
   * Reorder an item in a city's build queue.
   *
   * @param cityId - ID of the city
   * @param itemId - ID of the queue item to move
   * @param newIndex - Target position in the queue
   */
  reorderBuildQueue: (cityId: string, itemId: string, newIndex: number) => void;

  // ============================================================================
  // RESEARCH & CIVICS ACTIONS
  // ============================================================================

  /**
   * Add a technology to the research queue.
   *
   * @param techId - ID of the technology to queue
   */
  addToTechQueue: (techId: string) => void;

  /**
   * Remove a technology from the research queue.
   *
   * @param queueItemId - ID of the queue entry to remove
   */
  removeFromTechQueue: (queueItemId: string) => void;

  /**
   * Reorder a technology in the research queue.
   *
   * @param itemId - ID of the queue entry to move
   * @param newIndex - Target position in the queue
   */
  reorderTechQueue: (itemId: string, newIndex: number) => void;

  /**
   * Mark a technology as completed.
   * Moves it to completedTechs and removes from queue.
   *
   * @param techId - ID of the completed technology
   */
  completeTech: (techId: string) => void;

  /**
   * Add a civic to the civics queue.
   *
   * @param civicId - ID of the civic to queue
   */
  addToCivicQueue: (civicId: string) => void;

  /**
   * Remove a civic from the civics queue.
   *
   * @param queueItemId - ID of the queue entry to remove
   */
  removeFromCivicQueue: (queueItemId: string) => void;

  /**
   * Reorder a civic in the civics queue.
   *
   * @param itemId - ID of the queue entry to move
   * @param newIndex - Target position in the queue
   */
  reorderCivicQueue: (itemId: string, newIndex: number) => void;

  /**
   * Mark a civic as completed.
   * Moves it to completedCivics and removes from queue.
   *
   * @param civicId - ID of the completed civic
   */
  completeCivic: (civicId: string) => void;

  // ============================================================================
  // POLICY ACTIONS
  // ============================================================================

  /**
   * Update the current government and policy card configuration.
   *
   * @param loadout - New policy loadout with government and slot assignments
   */
  updatePolicies: (loadout: PolicyLoadout) => void;

  // ============================================================================
  // AI CIV ACTIONS
  // ============================================================================

  /**
   * Add a discovered AI civilization.
   *
   * @param civ - AI civ data (id is auto-generated)
   */
  addAICiv: (civ: Omit<AICiv, "id">) => void;

  /**
   * Update properties of an AI civilization.
   *
   * @param civId - ID of the AI civ to update
   * @param updates - Partial AI civ object with fields to update
   */
  updateAICiv: (civId: string, updates: Partial<AICiv>) => void;

  /**
   * Set the threat level assessment for an AI civilization.
   *
   * @param civId - ID of the AI civ
   * @param level - Assessed threat level
   */
  setThreatLevel: (civId: string, level: ThreatLevel) => void;

  // ============================================================================
  // RECOMMENDATION ACTIONS
  // ============================================================================

  /**
   * Add a new recommendation from the analysis engine.
   * Automatically assigns id, dismissed=false, and createdAt.
   *
   * @param rec - Recommendation data without auto-generated fields
   */
  addRecommendation: (rec: Omit<Recommendation, "id" | "dismissed" | "createdAt">) => void;

  /**
   * Mark a recommendation as dismissed by the user.
   *
   * @param recId - ID of the recommendation to dismiss
   */
  dismissRecommendation: (recId: string) => void;

  /**
   * Clear all recommendations (e.g., before regenerating).
   */
  clearRecommendations: () => void;
}

/**
 * Create an empty game state with default values.
 * Used when starting a new game or resetting state.
 *
 * @returns Empty state object with initialized collections and default values
 * @internal
 */
const createEmptyState = (): Omit<GameState, "setup"> => ({
  currentTurn: 1,
  currentEra: "ancient",
  tiles: new Map(),
  cities: [],
  completedTechs: new Set(),
  completedCivics: new Set(),
  currentTech: undefined,
  currentCivic: undefined,
  techQueue: [],
  civicQueue: [],
  policyLoadout: {
    government: "chiefdom",
    slots: [
      { slotType: "military" },
      { slotType: "economic" },
    ],
  },
  gold: 0,
  faith: 0,
  strategicResources: new Map(),
  aiCivs: [],
  lastUpdated: new Date(),
});

/**
 * Zustand store hook for accessing and updating game state.
 *
 * @returns The complete game store with state and actions
 *
 * @example
 * // Access multiple values and actions
 * const { tiles, cities, addTile } = useGameStore();
 *
 * @example
 * // Subscribe to specific state with selector (recommended for performance)
 * const currentTurn = useGameStore((state) => state.currentTurn);
 * const tileCount = useGameStore((state) => state.tiles.size);
 *
 * @example
 * // Use actions to update state
 * const { addTile } = useGameStore();
 * addTile({
 *   coord: { q: 0, r: 0 },
 *   terrain: "grassland",
 *   features: [],
 *   riverEdges: [false, false, false, false, false, false]
 * });
 */
export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  setup: {
    playerCiv: "",
    playerLeader: "",
    victoryType: "science",
    gameSpeed: "standard",
    dlc: {
      gatheringStorm: true,
      riseFall: true,
      dramaticAges: false,
      heroes: false,
      secretSocieties: false,
    },
  },
  ...createEmptyState(),
  recommendations: [],

  // Game lifecycle
  newGame: (setup) =>
    set({
      setup,
      ...createEmptyState(),
      recommendations: [],
    }),

  loadState: (state) =>
    set({
      ...state,
      recommendations: [],
    }),

  advanceTurn: (newTurn) =>
    set(() => ({
      currentTurn: newTurn,
      lastUpdated: new Date(),
    })),

  // Tiles
  addTile: (tile) =>
    set((s) => {
      const newTiles = new Map(s.tiles);
      newTiles.set(coordKey(tile.coord), {
        ...tile,
        plannedStates: [],
        isLocked: false,
        isPillaged: false,
      });
      return { tiles: newTiles, lastUpdated: new Date() };
    }),

  updateTile: (coord, updates) =>
    set((s) => {
      const key = coordKey(coord);
      const existing = s.tiles.get(key);
      if (!existing) return s;

      const newTiles = new Map(s.tiles);
      newTiles.set(key, { ...existing, ...updates });
      return { tiles: newTiles, lastUpdated: new Date() };
    }),

  addTilePlan: (coord, plan) =>
    set((s) => {
      const key = coordKey(coord);
      const existing = s.tiles.get(key);
      if (!existing) return s;

      const newTiles = new Map(s.tiles);
      newTiles.set(key, {
        ...existing,
        plannedStates: [...existing.plannedStates, { ...plan, id: uuidv4() }],
      });
      return { tiles: newTiles, lastUpdated: new Date() };
    }),

  removeTilePlan: (coord, planId) =>
    set((s) => {
      const key = coordKey(coord);
      const existing = s.tiles.get(key);
      if (!existing) return s;

      const newTiles = new Map(s.tiles);
      newTiles.set(key, {
        ...existing,
        plannedStates: existing.plannedStates.filter((p) => p.id !== planId),
      });
      return { tiles: newTiles, lastUpdated: new Date() };
    }),

  lockTile: (coord, locked) =>
    set((s) => {
      const key = coordKey(coord);
      const existing = s.tiles.get(key);
      if (!existing) return s;

      const newTiles = new Map(s.tiles);
      newTiles.set(key, { ...existing, isLocked: locked });
      return { tiles: newTiles, lastUpdated: new Date() };
    }),

  // Cities
  addCity: (city) =>
    set((s) => ({
      cities: [
        ...s.cities,
        { ...city, id: uuidv4(), buildQueue: [], plannedDistricts: [] },
      ],
      lastUpdated: new Date(),
    })),

  updateCity: (cityId, updates) =>
    set((s) => ({
      cities: s.cities.map((c) => (c.id === cityId ? { ...c, ...updates } : c)),
      lastUpdated: new Date(),
    })),

  addToBuildQueue: (cityId, item) =>
    set((s) => ({
      cities: s.cities.map((c) =>
        c.id === cityId
          ? {
              ...c,
              buildQueue: [...c.buildQueue, { ...item, id: uuidv4(), isLocked: false }],
            }
          : c
      ),
      lastUpdated: new Date(),
    })),

  removeFromBuildQueue: (cityId, itemId) =>
    set((s) => ({
      cities: s.cities.map((c) =>
        c.id === cityId
          ? { ...c, buildQueue: c.buildQueue.filter((i) => i.id !== itemId) }
          : c
      ),
      lastUpdated: new Date(),
    })),

  reorderBuildQueue: (cityId, itemId, newIndex) =>
    set((s) => ({
      cities: s.cities.map((c) => {
        if (c.id !== cityId) return c;
        const queue = [...c.buildQueue];
        const oldIndex = queue.findIndex((i) => i.id === itemId);
        if (oldIndex === -1) return c;
        const [item] = queue.splice(oldIndex, 1);
        queue.splice(newIndex, 0, item);
        return { ...c, buildQueue: queue };
      }),
      lastUpdated: new Date(),
    })),

  // Research
  addToTechQueue: (techId) =>
    set((s) => ({
      techQueue: [...s.techQueue, { id: uuidv4(), techId, isLocked: false }],
      lastUpdated: new Date(),
    })),

  removeFromTechQueue: (queueItemId) =>
    set((s) => ({
      techQueue: s.techQueue.filter((t) => t.id !== queueItemId),
      lastUpdated: new Date(),
    })),

  reorderTechQueue: (itemId, newIndex) =>
    set((s) => {
      const queue = [...s.techQueue];
      const oldIndex = queue.findIndex((t) => t.id === itemId);
      if (oldIndex === -1) return s;
      const [item] = queue.splice(oldIndex, 1);
      queue.splice(newIndex, 0, item);
      return { techQueue: queue, lastUpdated: new Date() };
    }),

  completeTech: (techId) =>
    set((s) => {
      const newCompleted = new Set(s.completedTechs);
      newCompleted.add(techId);
      return {
        completedTechs: newCompleted,
        techQueue: s.techQueue.filter((t) => t.techId !== techId),
        currentTech: undefined,
        lastUpdated: new Date(),
      };
    }),

  // Civics
  addToCivicQueue: (civicId) =>
    set((s) => ({
      civicQueue: [...s.civicQueue, { id: uuidv4(), civicId, isLocked: false }],
      lastUpdated: new Date(),
    })),

  removeFromCivicQueue: (queueItemId) =>
    set((s) => ({
      civicQueue: s.civicQueue.filter((c) => c.id !== queueItemId),
      lastUpdated: new Date(),
    })),

  reorderCivicQueue: (itemId, newIndex) =>
    set((s) => {
      const queue = [...s.civicQueue];
      const oldIndex = queue.findIndex((c) => c.id === itemId);
      if (oldIndex === -1) return s;
      const [item] = queue.splice(oldIndex, 1);
      queue.splice(newIndex, 0, item);
      return { civicQueue: queue, lastUpdated: new Date() };
    }),

  completeCivic: (civicId) =>
    set((s) => {
      const newCompleted = new Set(s.completedCivics);
      newCompleted.add(civicId);
      return {
        completedCivics: newCompleted,
        civicQueue: s.civicQueue.filter((c) => c.civicId !== civicId),
        currentCivic: undefined,
        lastUpdated: new Date(),
      };
    }),

  // Policies
  updatePolicies: (loadout) =>
    set({ policyLoadout: loadout, lastUpdated: new Date() }),

  // AI Civs
  addAICiv: (civ) =>
    set((s) => ({
      aiCivs: [...s.aiCivs, { ...civ, id: uuidv4() }],
      lastUpdated: new Date(),
    })),

  updateAICiv: (civId, updates) =>
    set((s) => ({
      aiCivs: s.aiCivs.map((c) => (c.id === civId ? { ...c, ...updates } : c)),
      lastUpdated: new Date(),
    })),

  setThreatLevel: (civId, level) =>
    set((s) => ({
      aiCivs: s.aiCivs.map((c) =>
        c.id === civId ? { ...c, threatLevel: level } : c
      ),
      lastUpdated: new Date(),
    })),

  // Recommendations
  addRecommendation: (rec) =>
    set((s) => ({
      recommendations: [
        ...s.recommendations,
        { ...rec, id: uuidv4(), dismissed: false, createdAt: new Date() },
      ],
    })),

  dismissRecommendation: (recId) =>
    set((s) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === recId ? { ...r, dismissed: true } : r
      ),
    })),

  clearRecommendations: () => set({ recommendations: [] }),
}));
