// ============================================================================
// COORDINATES & MAP
// ============================================================================

/** Axial hex coordinates */
export interface HexCoord {
  q: number;
  r: number;
}

/** Convert to string key for Maps/lookups */
export const coordKey = (c: HexCoord): string => `${c.q},${c.r}`;

// ============================================================================
// TILES
// ============================================================================

export type Terrain =
  | "grassland"
  | "plains"
  | "desert"
  | "tundra"
  | "snow"
  | "coast"
  | "ocean";

export type TerrainModifier = "hills" | "mountain";

export type Feature =
  | "woods"
  | "rainforest"
  | "marsh"
  | "floodplains"
  | "reef"
  | "geothermal"
  | "volcanic_soil"
  | "oasis"
  | "cliffs";

export type ResourceType = "strategic" | "luxury" | "bonus";

export interface Resource {
  name: string;
  type: ResourceType;
  revealed: boolean; // Some require tech to see
}

/** Which edges of the hex have rivers (0-5, starting NE going clockwise) */
export type RiverEdges = boolean[];

export type Improvement =
  | "farm"
  | "mine"
  | "quarry"
  | "plantation"
  | "camp"
  | "pasture"
  | "fishing_boats"
  | "lumber_mill"
  | "oil_well"
  | "offshore_platform"
  | "seaside_resort"
  | "ski_resort"
  | "fort"
  | "airstrip"
  | "missile_silo";

export type DistrictType =
  | "city_center"
  | "campus"
  | "holy_site"
  | "theater_square"
  | "commercial_hub"
  | "harbor"
  | "industrial_zone"
  | "encampment"
  | "entertainment_complex"
  | "water_park"
  | "aerodrome"
  | "spaceport"
  | "government_plaza"
  | "diplomatic_quarter"
  | "neighborhood"
  | "aqueduct"
  | "dam"
  | "canal"
  | "preserve";

// ============================================================================
// TILE STATE & TIMELINE
// ============================================================================

/** What triggers a planned state change */
export type StateTrigger =
  | { type: "immediate" }
  | { type: "tech"; techId: string }
  | { type: "civic"; civicId: string }
  | { type: "turn"; turn: number }
  | { type: "population"; cityId: string; pop: number }
  | { type: "manual" }; // User decides when

/** A single state in a tile's timeline */
export interface TilePlannedState {
  id: string;
  trigger: StateTrigger;
  action:
    | { type: "improve"; improvement: Improvement }
    | { type: "remove_feature" } // Chop/clear
    | { type: "place_district"; district: DistrictType }
    | { type: "place_wonder"; wonderId: string }
    | { type: "harvest_resource" };
  rationale?: string; // User's note on why
}

/** A tile on the map */
export interface Tile {
  coord: HexCoord;

  // Static (don't change during game)
  terrain: Terrain;
  modifier?: TerrainModifier;
  features: Feature[];
  resource?: Resource;
  riverEdges: RiverEdges;

  // Dynamic (current state)
  improvement?: Improvement;
  district?: DistrictType;
  wonder?: string;
  owningCityId?: string;
  isPillaged: boolean;

  // Planning
  plannedStates: TilePlannedState[];
  isLocked: boolean; // User says "don't suggest changes"
}

// ============================================================================
// CITIES
// ============================================================================

export type CitySpecialty =
  | "science"
  | "production"
  | "culture"
  | "faith"
  | "gold"
  | "military"
  | "wonder"
  | "generalist";

export interface BuildQueueItem {
  id: string;
  type: "district" | "building" | "wonder" | "unit" | "project";
  itemId: string; // e.g., "campus", "library", "settler"
  targetTile?: HexCoord; // For districts/wonders
  turnsRemaining?: number; // Estimated
  isLocked: boolean;
}

export interface City {
  id: string;
  name: string;
  location: HexCoord;

  // Current state
  population: number;
  housingCap: number;
  amenities: number; // Net (+/-)

  // Ownership
  ownedTiles: HexCoord[];
  workedTiles: HexCoord[];

  // Infrastructure
  districts: Array<{
    type: DistrictType;
    tile: HexCoord;
    buildings: string[];
    isPillaged: boolean;
  }>;

  // Planning
  specialty?: CitySpecialty;
  buildQueue: BuildQueueItem[];
  plannedDistricts: Array<{
    type: DistrictType;
    tile: HexCoord;
    trigger: StateTrigger;
  }>;

  // Governor
  governor?: {
    id: string;
    promotions: string[];
  };
}

// ============================================================================
// CIVS
// ============================================================================

export type DiplomaticStatus =
  | "unknown"
  | "friendly"
  | "neutral"
  | "unfriendly"
  | "denounced"
  | "war"
  | "allied";

export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

/** AI civ (limited info) */
export interface AICiv {
  id: string;
  leader: string;
  civName: string;
  status: DiplomaticStatus;
  threatLevel: ThreatLevel;
  knownCities: Array<{
    name: string;
    location: HexCoord;
  }>;
  claimedTiles: HexCoord[]; // Approximate borders
}

// ============================================================================
// TECH & CIVICS
// ============================================================================

export interface QueuedTech {
  id: string;
  techId: string;
  eurekaProgress?: {
    current: number;
    required: number;
    description: string;
  };
  isLocked: boolean;
}

export interface QueuedCivic {
  id: string;
  civicId: string;
  inspirationProgress?: {
    current: number;
    required: number;
    description: string;
  };
  isLocked: boolean;
}

// ============================================================================
// POLICIES & GOVERNMENT
// ============================================================================

export type PolicySlotType = "military" | "economic" | "diplomatic" | "wildcard";

export interface Policy {
  id: string;
  name: string;
  slotType: PolicySlotType;
  description: string;
}

export interface PolicyLoadout {
  government: string;
  slots: Array<{
    slotType: PolicySlotType;
    policyId?: string; // Empty slot if undefined
  }>;
}

// ============================================================================
// GAME STATE (TOP LEVEL)
// ============================================================================

export type VictoryType =
  | "science"
  | "culture"
  | "domination"
  | "religious"
  | "diplomatic"
  | "score";

export type GameSpeed = "online" | "quick" | "standard" | "epic" | "marathon";

export interface GameSetup {
  playerCiv: string;
  playerLeader: string;
  victoryType: VictoryType;
  gameSpeed: GameSpeed;
  dlc: {
    gatheringStorm: boolean;
    riseFall: boolean;
    dramaticAges: boolean;
    heroes: boolean;
    secretSocieties: boolean;
  };
}

export interface GameState {
  // Meta
  setup: GameSetup;
  currentTurn: number;
  currentEra: string;

  // Map
  tiles: Map<string, Tile>; // Key is coordKey(coord)

  // Player
  cities: City[];
  completedTechs: Set<string>;
  completedCivics: Set<string>;

  // Current research
  currentTech?: {
    techId: string;
    progress: number; // Accumulated science
    turnsRemaining: number;
  };
  currentCivic?: {
    civicId: string;
    progress: number;
    turnsRemaining: number;
  };

  // Queues
  techQueue: QueuedTech[];
  civicQueue: QueuedCivic[];

  // Government
  policyLoadout: PolicyLoadout;

  // Resources
  gold: number;
  faith: number;
  strategicResources: Map<string, number>; // e.g., "iron" -> 4

  // AI
  aiCivs: AICiv[];

  // Planning metadata
  lastUpdated: Date;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export type ConfidenceLevel = "high" | "medium" | "low";

export type RecommendationType =
  | "tile_plan"
  | "build_queue"
  | "research_queue"
  | "civic_queue"
  | "policy_swap"
  | "conflict"
  | "threat";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  confidence: ConfidenceLevel;
  title: string;
  shortReason: string;
  detailedReason?: string;
  action?: () => void; // One-click apply
  relatedCoord?: HexCoord;
  relatedCityId?: string;
  dismissed: boolean;
  createdAt: Date;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/** For JSON serialization (Maps/Sets don't serialize directly) */
export interface SerializedGameState {
  schemaVersion: number;
  setup: GameSetup;
  currentTurn: number;
  currentEra: string;
  tiles: Array<[string, Tile]>;
  cities: City[];
  completedTechs: string[];
  completedCivics: string[];
  currentTech?: GameState["currentTech"];
  currentCivic?: GameState["currentCivic"];
  techQueue: QueuedTech[];
  civicQueue: QueuedCivic[];
  policyLoadout: PolicyLoadout;
  gold: number;
  faith: number;
  strategicResources: Array<[string, number]>;
  aiCivs: AICiv[];
  lastUpdated: string;
}

export const CURRENT_SCHEMA_VERSION = 1;
