/**
 * @fileoverview Core domain types for the Civ 6 Strategic Planner.
 *
 * This module defines all the data structures used throughout the application,
 * including tiles, cities, game state, and planning-related types.
 *
 * @module types/model
 */

// ============================================================================
// COORDINATES & MAP
// ============================================================================

/**
 * Axial hex coordinates using the "pointy-top" or "flat-top" hex grid system.
 *
 * In axial coordinates, each hex is identified by two values (q, r).
 * The third cube coordinate (s) can be derived as s = -q - r.
 *
 * @example
 * // The origin hex
 * const origin: HexCoord = { q: 0, r: 0 };
 *
 * // A hex to the east
 * const east: HexCoord = { q: 1, r: 0 };
 *
 * // A hex to the southeast
 * const southeast: HexCoord = { q: 0, r: 1 };
 *
 * @see https://www.redblobgames.com/grids/hexagons/ - Comprehensive hex grid guide
 */
export interface HexCoord {
  /** The column coordinate (horizontal axis) */
  q: number;
  /** The row coordinate (diagonal axis) */
  r: number;
}

/**
 * Convert hex coordinates to a string key for use in Maps and lookups.
 *
 * @param c - The hex coordinate to convert
 * @returns A string in the format "q,r"
 *
 * @example
 * const key = coordKey({ q: 3, r: -1 }); // "3,-1"
 * tiles.get(key); // Look up a tile by coordinate
 */
export const coordKey = (c: HexCoord): string => `${c.q},${c.r}`;

// ============================================================================
// TILES
// ============================================================================

/**
 * Base terrain types that define the fundamental characteristics of a tile.
 *
 * - `grassland` - High food yield, supports most improvements
 * - `plains` - Balanced food/production, versatile
 * - `desert` - Low yields, limited improvements (except with Petra)
 * - `tundra` - Low yields, limited to northern regions
 * - `snow` - Very low yields, extreme terrain
 * - `coast` - Shallow water, supports harbors and fishing
 * - `ocean` - Deep water, limited use without specific techs
 */
export type Terrain = "grassland" | "plains" | "desert" | "tundra" | "snow" | "coast" | "ocean";

/**
 * Terrain modifiers that affect yields, movement, and buildability.
 *
 * - `hills` - +1 production, defensive bonus, allows mines
 * - `mountain` - Impassable, provides adjacency bonuses for districts
 */
export type TerrainModifier = "hills" | "mountain";

/**
 * Natural features that can exist on tiles, affecting yields and improvements.
 *
 * - `woods` - +1 production, can be chopped for production burst
 * - `rainforest` - +1 food, provides adjacency for Brazil
 * - `marsh` - -1 movement, can be cleared
 * - `floodplains` - +3 food (Nile), +1 food (others), enables Dam district
 * - `reef` - +1 food +1 production on coast tiles
 * - `geothermal` - +2 science, enables Geothermal Plant
 * - `volcanic_soil` - High yields from volcanic activity
 * - `oasis` - +3 food +1 gold in deserts, fresh water
 * - `cliffs` - Coastal feature, affects naval movement
 */
export type Feature = "woods" | "rainforest" | "marsh" | "floodplains" | "reef" | "geothermal" | "volcanic_soil" | "oasis" | "cliffs";

/**
 * Classification of resource types by their game function.
 *
 * - `strategic` - Required for specific units (horses, iron, niter, etc.)
 * - `luxury` - Provides amenities when improved
 * - `bonus` - Increases tile yields when improved
 */
export type ResourceType = "strategic" | "luxury" | "bonus";

/**
 * A resource located on a tile.
 *
 * @example
 * const iron: Resource = {
 *   name: "Iron",
 *   type: "strategic",
 *   revealed: true
 * };
 *
 * const hiddenOil: Resource = {
 *   name: "Oil",
 *   type: "strategic",
 *   revealed: false  // Requires specific tech to see
 * };
 */
export interface Resource {
  /** Display name of the resource (e.g., "Iron", "Wheat", "Diamonds") */
  name: string;
  /** Category of the resource */
  type: ResourceType;
  /** Whether the resource is visible (some require tech to reveal) */
  revealed: boolean;
}

/**
 * Array indicating which edges of a hex have rivers.
 *
 * Hex edges are numbered 0-5 starting from the east edge and going clockwise:
 * - 0: East (E)
 * - 1: Southeast (SE)
 * - 2: Southwest (SW)
 * - 3: West (W)
 * - 4: Northwest (NW)
 * - 5: Northeast (NE)
 *
 * @example
 * // River on east and southwest edges
 * const riverEdges: RiverEdges = [true, false, true, false, false, false];
 */
export type RiverEdges = boolean[];

/**
 * Tile improvements that can be built by builders.
 *
 * @remarks
 * Each improvement has specific terrain/resource requirements and provides
 * different yields. Some improvements unlock with specific technologies.
 */
export type Improvement =
  | "farm" // Food improvement, requires Agriculture
  | "mine" // Production improvement, requires Mining
  | "quarry" // Stone/marble improvement, requires Mining
  | "plantation" // Luxury resource improvement, requires Irrigation
  | "camp" // Fur/deer/ivory improvement, requires Animal Husbandry
  | "pasture" // Horse/cattle/sheep improvement, requires Animal Husbandry
  | "fishing_boats" // Water resource improvement, requires Celestial Navigation
  | "lumber_mill" // Woods improvement, requires Construction
  | "oil_well" // Oil improvement, requires Steel
  | "offshore_platform" // Ocean oil improvement, requires Plastics
  | "seaside_resort" // Tourism improvement, requires Radio
  | "ski_resort" // Mountain tourism, requires Professional Sports
  | "fort" // Defensive improvement, requires Siege Tactics
  | "airstrip" // Air unit base, requires Flight
  | "missile_silo"; // Nuclear capability, requires Rocketry

/**
 * District types that can be placed on tiles.
 *
 * Districts are specialized city developments that provide yields, buildings,
 * and adjacency bonuses. Each city can have a limited number of districts
 * based on population.
 *
 * @remarks
 * Specialty districts (campus, holy_site, etc.) require population thresholds.
 * Infrastructure districts (aqueduct, dam, canal) have placement restrictions.
 */
export type DistrictType =
  | "city_center" // Automatic, the city's founding tile
  | "campus" // Science district, unlocked by Writing
  | "holy_site" // Faith district, unlocked by Astrology
  | "theater_square" // Culture district, unlocked by Drama and Poetry
  | "commercial_hub" // Gold district, unlocked by Currency
  | "harbor" // Naval/trade district, unlocked by Celestial Navigation
  | "industrial_zone" // Production district, unlocked by Apprenticeship
  | "encampment" // Military district, unlocked by Bronze Working
  | "entertainment_complex" // Amenity district, unlocked by Games and Recreation
  | "water_park" // Coastal amenity district, unlocked by Games and Recreation
  | "aerodrome" // Air unit district, unlocked by Flight
  | "spaceport" // Space race district, unlocked by Rocketry
  | "government_plaza" // Unique government district (one per civ)
  | "diplomatic_quarter" // Diplomacy district, unlocked by Medieval Faires
  | "neighborhood" // Housing district, unlocked by Urbanization
  | "aqueduct" // Water infrastructure, unlocked by Engineering
  | "dam" // Flood control, unlocked by Buttress
  | "canal" // Water passage, unlocked by Steam Power
  | "preserve"; // Nature conservation, unlocked by Mysticism

// ============================================================================
// TILE STATE & TIMELINE
// ============================================================================

/**
 * Trigger conditions that determine when a planned state change should occur.
 *
 * Triggers allow players to plan future tile changes that activate based on
 * game progress rather than specific turns.
 *
 * @example
 * // Trigger immediately
 * const immediate: StateTrigger = { type: "immediate" };
 *
 * // Trigger when Apprenticeship is researched
 * const atTech: StateTrigger = { type: "tech", techId: "apprenticeship" };
 *
 * // Trigger at turn 100
 * const atTurn: StateTrigger = { type: "turn", turn: 100 };
 *
 * // Trigger when city reaches population 7
 * const atPop: StateTrigger = { type: "population", cityId: "city-123", pop: 7 };
 */
export type StateTrigger =
  | { type: "immediate" }
  | { type: "tech"; techId: string }
  | { type: "civic"; civicId: string }
  | { type: "turn"; turn: number }
  | { type: "population"; cityId: string; pop: number }
  | { type: "manual" }; // User decides when

/**
 * A planned future state for a tile, part of the tile's timeline.
 *
 * Each planned state represents an action to take on the tile when the
 * trigger condition is met. Multiple planned states can be queued to
 * create a development timeline for each tile.
 *
 * @example
 * const plan: TilePlannedState = {
 *   id: "plan-123",
 *   trigger: { type: "tech", techId: "apprenticeship" },
 *   action: { type: "place_district", district: "industrial_zone" },
 *   rationale: "Best IZ spot with +4 adjacency"
 * };
 */
export interface TilePlannedState {
  /** Unique identifier for this planned state */
  id: string;
  /** Condition that triggers this state change */
  trigger: StateTrigger;
  /** The action to perform when triggered */
  action:
    | { type: "improve"; improvement: Improvement }
    | { type: "remove_feature" } // Chop/clear woods, rainforest, marsh
    | { type: "place_district"; district: DistrictType }
    | { type: "place_wonder"; wonderId: string }
    | { type: "harvest_resource" };
  /** Optional user note explaining the reasoning */
  rationale?: string;
}

/**
 * A tile on the hex map, representing a single game tile.
 *
 * Tiles have both static properties (terrain, features, resources) that
 * don't change during a game, and dynamic properties (improvements, districts)
 * that evolve as the game progresses.
 *
 * @example
 * const tile: Tile = {
 *   coord: { q: 3, r: -1 },
 *   terrain: "grassland",
 *   modifier: "hills",
 *   features: ["woods"],
 *   resource: { name: "Deer", type: "bonus", revealed: true },
 *   riverEdges: [true, false, false, false, false, true],
 *   improvement: "camp",
 *   district: undefined,
 *   wonder: undefined,
 *   owningCityId: "city-456",
 *   isPillaged: false,
 *   plannedStates: [],
 *   isLocked: false
 * };
 */
export interface Tile {
  /** Axial coordinates identifying this tile's position */
  coord: HexCoord;

  // Static properties (don't change during game)
  /** Base terrain type */
  terrain: Terrain;
  /** Optional terrain modifier (hills or mountain) */
  modifier?: TerrainModifier;
  /** Natural features present on the tile */
  features: Feature[];
  /** Resource on this tile, if any */
  resource?: Resource;
  /** Which hex edges have rivers (array of 6 booleans) */
  riverEdges: RiverEdges;

  // Dynamic properties (current state)
  /** Current improvement on the tile */
  improvement?: Improvement;
  /** District placed on this tile */
  district?: DistrictType;
  /** Wonder built on this tile */
  wonder?: string;
  /** ID of the city that owns this tile */
  owningCityId?: string;
  /** Whether the improvement/district is pillaged */
  isPillaged: boolean;

  // Planning properties
  /** Queue of planned future states for this tile */
  plannedStates: TilePlannedState[];
  /** If true, the engine won't suggest changes to this tile */
  isLocked: boolean;
}

// ============================================================================
// CITIES
// ============================================================================

/**
 * City specialization roles that inform build priorities and recommendations.
 *
 * - `science` - Focus on campus and research buildings
 * - `production` - Focus on industrial zone and production
 * - `culture` - Focus on theater square and tourism
 * - `faith` - Focus on holy site and religious units
 * - `gold` - Focus on commercial hub and trade
 * - `military` - Focus on encampment and unit production
 * - `wonder` - Designated for wonder construction
 * - `generalist` - Balanced development
 */
export type CitySpecialty = "science" | "production" | "culture" | "faith" | "gold" | "military" | "wonder" | "generalist";

/**
 * An item in a city's build queue.
 *
 * @example
 * const campusProject: BuildQueueItem = {
 *   id: "build-123",
 *   type: "district",
 *   itemId: "campus",
 *   targetTile: { q: 2, r: -1 },
 *   turnsRemaining: 8,
 *   isLocked: false
 * };
 */
export interface BuildQueueItem {
  /** Unique identifier for this queue item */
  id: string;
  /** Category of the item being built */
  type: "district" | "building" | "wonder" | "unit" | "project";
  /** Specific item ID (e.g., "campus", "library", "settler") */
  itemId: string;
  /** Target tile for districts and wonders */
  targetTile?: HexCoord;
  /** Estimated turns to completion */
  turnsRemaining?: number;
  /** If true, don't reorder this item in the queue */
  isLocked: boolean;
}

/**
 * A city in the player's empire.
 *
 * Cities are the primary production centers, owning tiles and building
 * districts, buildings, and units. Each city tracks its population,
 * infrastructure, and build plans.
 *
 * @example
 * const capital: City = {
 *   id: "city-001",
 *   name: "Seoul",
 *   location: { q: 0, r: 0 },
 *   population: 12,
 *   housingCap: 15,
 *   amenities: 2,
 *   ownedTiles: [...],
 *   workedTiles: [...],
 *   districts: [{ type: "campus", tile: { q: 1, r: 0 }, buildings: ["library"], isPillaged: false }],
 *   specialty: "science",
 *   buildQueue: [...],
 *   plannedDistricts: [...],
 *   governor: { id: "pingala", promotions: ["researcher"] }
 * };
 */
export interface City {
  /** Unique identifier for this city */
  id: string;
  /** Display name of the city */
  name: string;
  /** Location of the city center tile */
  location: HexCoord;

  // Current state
  /** Current population count */
  population: number;
  /** Maximum housing capacity */
  housingCap: number;
  /** Net amenities (+positive = happy, -negative = unhappy) */
  amenities: number;

  // Tile ownership
  /** All tiles within the city's borders */
  ownedTiles: HexCoord[];
  /** Tiles currently being worked by citizens */
  workedTiles: HexCoord[];

  // Infrastructure
  /** Built districts with their buildings */
  districts: Array<{
    type: DistrictType;
    tile: HexCoord;
    buildings: string[];
    isPillaged: boolean;
  }>;

  // Planning
  /** Assigned specialty role for this city */
  specialty?: CitySpecialty;
  /** Current production queue */
  buildQueue: BuildQueueItem[];
  /** Planned future districts */
  plannedDistricts: Array<{
    type: DistrictType;
    tile: HexCoord;
    trigger: StateTrigger;
  }>;

  // Governor
  /** Assigned governor and their promotions */
  governor?: {
    id: string;
    promotions: string[];
  };
}

// ============================================================================
// CIVS
// ============================================================================

/**
 * Diplomatic relationship status with an AI civilization.
 *
 * - `unknown` - Haven't met this civ yet
 * - `friendly` - Positive relationship
 * - `neutral` - No strong feelings either way
 * - `unfriendly` - Negative relationship
 * - `denounced` - Formally denounced (by them or us)
 * - `war` - Currently at war
 * - `allied` - Formal alliance active
 */
export type DiplomaticStatus = "unknown" | "friendly" | "neutral" | "unfriendly" | "denounced" | "war" | "allied";

/**
 * Assessed military threat level from an AI civilization.
 *
 * Used to prioritize defensive planning and adjust recommendations.
 */
export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

/**
 * An AI civilization in the game (limited information compared to player).
 *
 * @example
 * const aztec: AICiv = {
 *   id: "ai-aztec",
 *   leader: "montezuma",
 *   civName: "Aztec",
 *   status: "unfriendly",
 *   threatLevel: "high",
 *   knownCities: [{ name: "Tenochtitlan", location: { q: 10, r: -5 } }],
 *   claimedTiles: [...]
 * };
 */
export interface AICiv {
  /** Unique identifier for this AI civ */
  id: string;
  /** Leader ID (e.g., "montezuma", "cleopatra") */
  leader: string;
  /** Civilization name (e.g., "Aztec", "Egypt") */
  civName: string;
  /** Current diplomatic relationship */
  status: DiplomaticStatus;
  /** Assessed military threat level */
  threatLevel: ThreatLevel;
  /** Cities we've discovered belonging to this civ */
  knownCities: Array<{
    name: string;
    location: HexCoord;
  }>;
  /** Approximate borders based on observed tiles */
  claimedTiles: HexCoord[];
}

// ============================================================================
// TECH & CIVICS
// ============================================================================

/**
 * A technology in the research queue.
 *
 * @example
 * const apprenticeship: QueuedTech = {
 *   id: "queue-123",
 *   techId: "apprenticeship",
 *   eurekaProgress: { current: 2, required: 3, description: "Build 3 mines" },
 *   isLocked: false
 * };
 */
export interface QueuedTech {
  /** Unique identifier for this queue entry */
  id: string;
  /** Technology ID being researched */
  techId: string;
  /** Progress toward the Eureka bonus, if applicable */
  eurekaProgress?: {
    current: number;
    required: number;
    description: string;
  };
  /** If true, don't reorder in the queue */
  isLocked: boolean;
}

/**
 * A civic in the civics queue.
 *
 * @example
 * const feudalism: QueuedCivic = {
 *   id: "queue-456",
 *   civicId: "feudalism",
 *   inspirationProgress: { current: 4, required: 6, description: "Build 6 farms" },
 *   isLocked: false
 * };
 */
export interface QueuedCivic {
  /** Unique identifier for this queue entry */
  id: string;
  /** Civic ID being researched */
  civicId: string;
  /** Progress toward the Inspiration bonus, if applicable */
  inspirationProgress?: {
    current: number;
    required: number;
    description: string;
  };
  /** If true, don't reorder in the queue */
  isLocked: boolean;
}

// ============================================================================
// POLICIES & GOVERNMENT
// ============================================================================

/**
 * Types of policy card slots available in governments.
 *
 * - `military` - Combat, unit maintenance, and production bonuses
 * - `economic` - Resource, trade, and infrastructure bonuses
 * - `diplomatic` - City-state, alliance, and diplomatic bonuses
 * - `wildcard` - Can hold any policy type, including great person policies
 */
export type PolicySlotType = "military" | "economic" | "diplomatic" | "wildcard";

/**
 * A policy card that can be slotted into government.
 */
export interface Policy {
  /** Unique identifier for this policy */
  id: string;
  /** Display name (e.g., "Rationalism", "Conscription") */
  name: string;
  /** Which slot type this policy fits into */
  slotType: PolicySlotType;
  /** Description of the policy's effects */
  description: string;
}

/**
 * The current government configuration and active policies.
 *
 * @example
 * const loadout: PolicyLoadout = {
 *   government: "democracy",
 *   slots: [
 *     { slotType: "military", policyId: "military_research" },
 *     { slotType: "military", policyId: "conscription" },
 *     { slotType: "economic", policyId: "rationalism" },
 *     { slotType: "economic", policyId: "free_market" },
 *     { slotType: "diplomatic", policyId: "arsenal_of_democracy" },
 *     { slotType: "wildcard", policyId: "new_deal" },
 *     { slotType: "wildcard" }  // Empty slot
 *   ]
 * };
 */
export interface PolicyLoadout {
  /** Current government type (e.g., "chiefdom", "democracy") */
  government: string;
  /** Available slots with their current policies */
  slots: Array<{
    slotType: PolicySlotType;
    policyId?: string; // Empty slot if undefined
  }>;
}

// ============================================================================
// GAME STATE (TOP LEVEL)
// ============================================================================

/**
 * Victory conditions available in Civilization 6.
 *
 * - `science` - Launch Mars colony (space race)
 * - `culture` - Attract more visiting tourists than any civ has domestic tourists
 * - `domination` - Capture all original capitals
 * - `religious` - Convert all civilizations to your religion
 * - `diplomatic` - Accumulate diplomatic victory points
 * - `score` - Highest score when turn limit reached
 */
export type VictoryType = "science" | "culture" | "domination" | "religious" | "diplomatic" | "score";

/**
 * Game speed settings that affect production/research times.
 *
 * - `online` - Fastest, ~250 turns
 * - `quick` - Fast, ~330 turns
 * - `standard` - Normal, ~500 turns
 * - `epic` - Slow, ~750 turns
 * - `marathon` - Slowest, ~1500 turns
 */
export type GameSpeed = "online" | "quick" | "standard" | "epic" | "marathon";

/**
 * Initial game configuration selected at game start.
 *
 * @example
 * const setup: GameSetup = {
 *   playerCiv: "korea",
 *   playerLeader: "seondeok",
 *   victoryType: "science",
 *   gameSpeed: "standard",
 *   dlc: {
 *     gatheringStorm: true,
 *     riseFall: true,
 *     dramaticAges: false,
 *     heroes: false,
 *     secretSocieties: false
 *   }
 * };
 */
export interface GameSetup {
  /** Selected civilization ID */
  playerCiv: string;
  /** Selected leader ID */
  playerLeader: string;
  /** Target victory condition */
  victoryType: VictoryType;
  /** Game speed setting */
  gameSpeed: GameSpeed;
  /** Enabled DLC and game modes */
  dlc: {
    gatheringStorm: boolean;
    riseFall: boolean;
    dramaticAges: boolean;
    heroes: boolean;
    secretSocieties: boolean;
  };
}

/**
 * The complete game state at a point in time.
 *
 * This is the root state object that contains all game data. It's managed
 * by the Zustand store and persisted to disk as JSON.
 *
 * @see SerializedGameState for the JSON-serializable version
 */
export interface GameState {
  // Meta
  /** Initial game configuration */
  setup: GameSetup;
  /** Current turn number */
  currentTurn: number;
  /** Current era name (e.g., "ancient", "classical") */
  currentEra: string;

  // Map
  /** All tiles, keyed by coordinate string */
  tiles: Map<string, Tile>;

  // Player state
  /** Player's cities */
  cities: City[];
  /** Completed technology IDs */
  completedTechs: Set<string>;
  /** Completed civic IDs */
  completedCivics: Set<string>;

  // Current research
  /** Currently researching technology */
  currentTech?: {
    techId: string;
    progress: number;
    turnsRemaining: number;
  };
  /** Currently researching civic */
  currentCivic?: {
    civicId: string;
    progress: number;
    turnsRemaining: number;
  };

  // Queues
  /** Planned technology research order */
  techQueue: QueuedTech[];
  /** Planned civic research order */
  civicQueue: QueuedCivic[];

  // Government
  /** Current policy configuration */
  policyLoadout: PolicyLoadout;

  // Resources
  /** Current gold stockpile */
  gold: number;
  /** Current faith stockpile */
  faith: number;
  /** Strategic resources and quantities */
  strategicResources: Map<string, number>;

  // AI civilizations
  /** Known AI civilizations */
  aiCivs: AICiv[];

  // Planning metadata
  /** When the state was last modified */
  lastUpdated: Date;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Confidence level for a recommendation.
 *
 * - `high` - Clear best choice with significant margin
 * - `medium` - Best option but alternatives are competitive
 * - `low` - Trade-off situation, depends on priorities
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Categories of recommendations the engine can provide.
 */
export type RecommendationType =
  | "tile_plan" // Suggested tile use change
  | "build_queue" // Build order suggestion
  | "research_queue" // Tech queue reordering
  | "civic_queue" // Civic queue reordering
  | "policy_swap" // Policy change suggestion
  | "conflict" // Conflicting plans detected
  | "threat"; // Military threat warning

/**
 * A suggestion from the recommendations engine.
 *
 * @example
 * const rec: Recommendation = {
 *   id: "rec-123",
 *   type: "tile_plan",
 *   confidence: "high",
 *   title: "Campus placement",
 *   shortReason: "+5 adjacency from mountains",
 *   detailedReason: "Tile (3,-1) provides +5 campus adjacency...",
 *   relatedCoord: { q: 3, r: -1 },
 *   dismissed: false,
 *   createdAt: new Date()
 * };
 */
export interface Recommendation {
  /** Unique identifier */
  id: string;
  /** Category of recommendation */
  type: RecommendationType;
  /** How confident the engine is in this suggestion */
  confidence: ConfidenceLevel;
  /** Short title for display */
  title: string;
  /** Brief explanation (1-2 sentences) */
  shortReason: string;
  /** Detailed explanation with full reasoning */
  detailedReason?: string;
  /** Optional callback to apply the recommendation */
  action?: () => void;
  /** Related tile coordinate, if applicable */
  relatedCoord?: HexCoord;
  /** Related city ID, if applicable */
  relatedCityId?: string;
  /** Whether the user has dismissed this recommendation */
  dismissed: boolean;
  /** When this recommendation was generated */
  createdAt: Date;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * JSON-serializable version of GameState.
 *
 * Maps and Sets don't serialize to JSON directly, so this interface
 * converts them to arrays for persistence. Use `serialize()` and
 * `deserialize()` functions to convert between GameState and this format.
 *
 * @see GameState for the runtime version
 */
export interface SerializedGameState {
  /** Schema version for migration support */
  schemaVersion: number;
  setup: GameSetup;
  currentTurn: number;
  currentEra: string;
  /** Tiles as [key, value] pairs */
  tiles: Array<[string, Tile]>;
  cities: City[];
  /** Completed techs as array of IDs */
  completedTechs: string[];
  /** Completed civics as array of IDs */
  completedCivics: string[];
  currentTech?: GameState["currentTech"];
  currentCivic?: GameState["currentCivic"];
  techQueue: QueuedTech[];
  civicQueue: QueuedCivic[];
  policyLoadout: PolicyLoadout;
  gold: number;
  faith: number;
  /** Strategic resources as [name, count] pairs */
  strategicResources: Array<[string, number]>;
  aiCivs: AICiv[];
  /** ISO date string */
  lastUpdated: string;
}

/**
 * Current schema version for save files.
 *
 * Increment this when making breaking changes to the data model.
 * The deserialize function should handle migration from older versions.
 */
export const CURRENT_SCHEMA_VERSION = 1;
