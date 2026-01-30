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
} from "./model";

interface GameStore extends GameState {
  // Recommendations (not persisted)
  recommendations: Recommendation[];

  // Actions - Game lifecycle
  newGame: (setup: GameSetup) => void;
  loadState: (state: GameState) => void;
  advanceTurn: (newTurn: number) => void;

  // Actions - Tiles
  addTile: (tile: Omit<Tile, "plannedStates" | "isLocked" | "isPillaged">) => void;
  updateTile: (coord: HexCoord, updates: Partial<Tile>) => void;
  addTilePlan: (coord: HexCoord, plan: Omit<TilePlannedState, "id">) => void;
  removeTilePlan: (coord: HexCoord, planId: string) => void;
  lockTile: (coord: HexCoord, locked: boolean) => void;

  // Actions - Cities
  addCity: (city: Omit<City, "id" | "buildQueue" | "plannedDistricts">) => void;
  updateCity: (cityId: string, updates: Partial<City>) => void;
  addToBuildQueue: (cityId: string, item: Omit<BuildQueueItem, "id" | "isLocked">) => void;
  removeFromBuildQueue: (cityId: string, itemId: string) => void;
  reorderBuildQueue: (cityId: string, itemId: string, newIndex: number) => void;

  // Actions - Research & Civics
  addToTechQueue: (techId: string) => void;
  removeFromTechQueue: (queueItemId: string) => void;
  reorderTechQueue: (itemId: string, newIndex: number) => void;
  completeTech: (techId: string) => void;
  addToCivicQueue: (civicId: string) => void;
  removeFromCivicQueue: (queueItemId: string) => void;
  reorderCivicQueue: (itemId: string, newIndex: number) => void;
  completeCivic: (civicId: string) => void;

  // Actions - Policies
  updatePolicies: (loadout: PolicyLoadout) => void;

  // Actions - AI Civs
  addAICiv: (civ: Omit<AICiv, "id">) => void;
  updateAICiv: (civId: string, updates: Partial<AICiv>) => void;
  setThreatLevel: (civId: string, level: ThreatLevel) => void;

  // Actions - Recommendations
  addRecommendation: (rec: Omit<Recommendation, "id" | "dismissed" | "createdAt">) => void;
  dismissRecommendation: (recId: string) => void;
  clearRecommendations: () => void;
}

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
