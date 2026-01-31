/**
 * @fileoverview District adjacency bonus calculator for Civilization 6.
 *
 * This module calculates adjacency bonuses for all district types based on
 * neighboring tiles, terrain, features, improvements, and other districts.
 *
 * @module renderer/utils/adjacencyCalculator
 */

import { HexCoord, Tile, DistrictType, coordKey } from "../../types/model";
import { hexNeighbors } from "./hexUtils";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single source of adjacency bonus.
 *
 * @example
 * const mountainBonus: AdjacencySource = {
 *   source: "Mountain",
 *   count: 2,
 *   bonusPerSource: 1,
 *   totalBonus: 2
 * };
 */
export interface AdjacencySource {
  /** Display name of the bonus source (e.g., "Mountain", "Mine", "River") */
  source: string;
  /** Number of adjacent tiles providing this bonus */
  count: number;
  /** Bonus per adjacent source */
  bonusPerSource: number;
  /** Total bonus from this source (count * bonusPerSource; final bonus is floor of sum of totalBonus) */
  totalBonus: number;
}

/**
 * Complete adjacency calculation result for a district.
 *
 * @example
 * const campusResult: AdjacencyResult = {
 *   district: "campus",
 *   bonus: 4,
 *   breakdown: [
 *     { source: "Mountain", count: 2, bonusPerSource: 1, totalBonus: 2 },
 *     { source: "Rainforest", count: 1, bonusPerSource: 1, totalBonus: 1 },
 *     { source: "District", count: 2, bonusPerSource: 0.5, totalBonus: 1 }
 *   ]
 * };
 */
export interface AdjacencyResult {
  /** The district type this calculation is for */
  district: DistrictType;
  /** Total adjacency bonus (sum of all sources, floored to integer) */
  bonus: number;
  /** Detailed breakdown of bonus sources */
  breakdown: AdjacencySource[];
}

// ============================================================================
// DISTRICT ADJACENCY RULES
// ============================================================================

/**
 * Districts that provide standard adjacency bonuses.
 * Most specialty districts get +0.5 from adjacent districts.
 */
const STANDARD_DISTRICTS: DistrictType[] = [
  "campus",
  "holy_site",
  "theater_square",
  "commercial_hub",
  "industrial_zone",
  "harbor",
  "encampment",
  "entertainment_complex",
  "water_park",
  "aerodrome",
  "spaceport",
  "neighborhood",
  "preserve",
  "diplomatic_quarter",
];

/**
 * Districts that count for adjacency bonuses from other districts.
 * Excludes wonders and city improvements that don't count.
 */
const ADJACENCY_PROVIDING_DISTRICTS: DistrictType[] = [
  "city_center",
  "campus",
  "holy_site",
  "theater_square",
  "commercial_hub",
  "harbor",
  "industrial_zone",
  "encampment",
  "entertainment_complex",
  "water_park",
  "aerodrome",
  "spaceport",
  "government_plaza",
  "diplomatic_quarter",
  "neighborhood",
  "aqueduct",
  "dam",
  "canal",
  "preserve",
];

/**
 * Districts that can only be placed on water (coast/ocean) tiles.
 */
const WATER_ONLY_DISTRICTS: DistrictType[] = ["harbor", "water_park"];

/**
 * Whether a district can be placed on water tiles (coast/ocean).
 *
 * @param district - District type to check
 * @returns true if the district is water/coast-only (e.g. Harbor, Water Park)
 */
export function isWaterDistrict(district: DistrictType): boolean {
  return WATER_ONLY_DISTRICTS.includes(district);
}

// ============================================================================
// CIV-SPECIFIC BONUSES
// ============================================================================

/**
 * Civilization-specific adjacency modifiers.
 *
 * These adjust the standard adjacency bonuses based on the player's civilization,
 * reflecting unique abilities and districts.
 */
export interface CivAdjacencyModifiers {
  /** Multiplier for district adjacency (default 0.5, Japan gets 1.0) */
  districtBonusMultiplier: number;
  /** Additional bonuses for specific features (e.g., Brazil rainforest) */
  featureBonuses: Record<string, number>;
  /** Custom district adjacency rules */
  customDistricts: Partial<Record<DistrictType, CustomDistrictRules>>;
}

/**
 * Custom rules for civ-specific unique districts.
 */
interface CustomDistrictRules {
  /** District this replaces (e.g., hansa replaces industrial_zone) */
  replaces?: DistrictType;
  /** Additional adjacency sources */
  extraSources: Array<{
    source: string;
    match: (tile: Tile) => boolean;
    bonusPerSource: number;
  }>;
}

/**
 * Get civ-specific adjacency modifiers.
 *
 * @param civId - Civilization ID (e.g., "japan", "germany", "brazil")
 * @returns Modifiers for the civilization, or default values if not found
 */
export const getCivModifiers = (civId?: string): CivAdjacencyModifiers => {
  const defaultModifiers: CivAdjacencyModifiers = {
    districtBonusMultiplier: 0.5,
    featureBonuses: {},
    customDistricts: {},
  };

  if (!civId) return defaultModifiers;

  switch (civId.toLowerCase()) {
    case "japan":
      // Meiji Restoration: All districts get +1 adjacency from other districts
      return {
        ...defaultModifiers,
        districtBonusMultiplier: 1.0,
      };

    case "germany":
      // Hansa: Unique Industrial Zone with special adjacency
      return {
        ...defaultModifiers,
        customDistricts: {
          industrial_zone: {
            replaces: "industrial_zone",
            extraSources: [
              {
                source: "Commercial Hub (Germany)",
                match: (t) => t.district === "commercial_hub",
                bonusPerSource: 2,
              },
              {
                source: "Resource (Germany)",
                match: (t) => t.resource !== undefined,
                bonusPerSource: 1,
              },
            ],
          },
        },
      };

    case "brazil":
      // Street Carnival / Copacabana: Unique entertainment complex
      // Amazon: Rainforest tiles provide +1 adjacency to Commercial Hub, Holy Site, Theater Square
      // Campus rainforest is handled solely by calculateCampusAdjacency to avoid double-counting
      return {
        ...defaultModifiers,
        featureBonuses: {
          rainforest_commercial_hub: 1,
          rainforest_holy_site: 1,
          rainforest_theater_square: 1,
        },
      };

    case "korea":
      // Seowon: Unique Campus that gets +4 base but loses adjacency bonuses
      // (Implemented as a separate consideration - Seowon doesn't use normal adjacency)
      return {
        ...defaultModifiers,
        customDistricts: {
          campus: {
            replaces: "campus",
            extraSources: [], // Seowon has fixed +4 science, doesn't benefit from adjacency
          },
        },
      };

    case "australia":
      // Outback Station pastures provide +0.5 production adjacency (applies via improvements)
      // Charming/Breathtaking appeal provides +3/+6 to specific districts
      return {
        ...defaultModifiers,
        customDistricts: {
          campus: {
            extraSources: [
              {
                source: "Pasture (Australia)",
                match: (t) => t.improvement === "pasture",
                bonusPerSource: 0.5,
              },
            ],
          },
          commercial_hub: {
            extraSources: [
              {
                source: "Pasture (Australia)",
                match: (t) => t.improvement === "pasture",
                bonusPerSource: 0.5,
              },
            ],
          },
          holy_site: {
            extraSources: [
              {
                source: "Pasture (Australia)",
                match: (t) => t.improvement === "pasture",
                bonusPerSource: 0.5,
              },
            ],
          },
          theater_square: {
            extraSources: [
              {
                source: "Pasture (Australia)",
                match: (t) => t.improvement === "pasture",
                bonusPerSource: 0.5,
              },
            ],
          },
        },
      };

    case "russia":
      // Lavra: Unique Holy Site with +1 Great Prophet point per adjacent tundra
      // Note: Adjacency bonus is standard, but tundra provides additional benefits
      return defaultModifiers;

    case "maya":
      // Observatory: Unique Campus adjacent to Farms and Plantations
      return {
        ...defaultModifiers,
        customDistricts: {
          campus: {
            replaces: "campus",
            extraSources: [
              {
                source: "Farm (Maya)",
                match: (t) => t.improvement === "farm",
                bonusPerSource: 0.5,
              },
              {
                source: "Plantation (Maya)",
                match: (t) => t.improvement === "plantation",
                bonusPerSource: 2,
              },
            ],
          },
        },
      };

    default:
      return defaultModifiers;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get neighboring tiles with their data.
 *
 * @param coord - Center tile coordinates
 * @param tiles - Map of all tiles
 * @returns Array of neighboring tiles (only tiles that exist in the map)
 */
const getNeighborTiles = (
  coord: HexCoord,
  tiles: Map<string, Tile>
): Tile[] => {
  const neighbors = hexNeighbors(coord);
  return neighbors
    .map((n) => tiles.get(coordKey(n)))
    .filter((t): t is Tile => t !== undefined);
};

/**
 * Check if a tile has a river on any edge.
 *
 * @param tile - The tile to check
 * @returns True if the tile has at least one river edge
 */
const hasRiver = (tile: Tile): boolean => {
  return tile.riverEdges?.some((e) => e) ?? false;
};

/**
 * Count adjacent tiles matching a predicate.
 *
 * @param neighbors - Array of neighboring tiles
 * @param predicate - Function to test each tile
 * @returns Count of matching tiles
 */
const countMatching = (
  neighbors: Tile[],
  predicate: (tile: Tile) => boolean
): number => {
  return neighbors.filter(predicate).length;
};

/**
 * Create an adjacency source entry.
 *
 * @param source - Name of the bonus source
 * @param count - Number of adjacent sources
 * @param bonusPerSource - Bonus per source
 * @returns AdjacencySource object, or null if count is 0
 */
const createSource = (
  source: string,
  count: number,
  bonusPerSource: number
): AdjacencySource | null => {
  if (count === 0) return null;
  return {
    source,
    count,
    bonusPerSource,
    totalBonus: count * bonusPerSource,
  };
};

// ============================================================================
// DISTRICT-SPECIFIC CALCULATORS
// ============================================================================

/**
 * Calculate Campus adjacency bonus.
 * +1 from mountains, +1 from rainforest, +1 from reef, +1 from geothermal, +0.5 from districts
 */
const calculateCampusAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const mountains = countMatching(neighbors, (t) => t.modifier === "mountain");
  const rainforest = countMatching(neighbors, (t) => t.features.includes("rainforest"));
  const reef = countMatching(neighbors, (t) => t.features.includes("reef"));
  const geothermal = countMatching(neighbors, (t) => t.features.includes("geothermal"));

  const mountainSource = createSource("Mountain", mountains, 1);
  const rainforestSource = createSource("Rainforest", rainforest, 1);
  const reefSource = createSource("Reef", reef, 1);
  const geothermalSource = createSource("Geothermal Fissure", geothermal, 1);

  if (mountainSource) sources.push(mountainSource);
  if (rainforestSource) sources.push(rainforestSource);
  if (reefSource) sources.push(reefSource);
  if (geothermalSource) sources.push(geothermalSource);

  return sources;
};

/**
 * Calculate Holy Site adjacency bonus.
 * +1 from mountains, +1 from woods, +1 from natural wonders, +0.5 from districts
 */
const calculateHolySiteAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const mountains = countMatching(neighbors, (t) => t.modifier === "mountain");
  const woods = countMatching(neighbors, (t) => t.features.includes("woods"));
  // Natural wonders would be tracked separately - for now we'll check for a wonder property
  // Since our model uses `wonder?: string` for built wonders, natural wonders could be features
  // We'll treat volcanic_soil and oasis as potential natural wonder proxies for now

  const mountainSource = createSource("Mountain", mountains, 1);
  const woodsSource = createSource("Woods", woods, 1);

  if (mountainSource) sources.push(mountainSource);
  if (woodsSource) sources.push(woodsSource);

  return sources;
};

/**
 * Calculate Theater Square adjacency bonus.
 * +1 from wonders, +2 from entertainment complex/water park, +0.5 from districts
 */
const calculateTheaterSquareAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const wonders = countMatching(neighbors, (t) => t.wonder !== undefined);
  const entertainment = countMatching(
    neighbors,
    (t) => t.district === "entertainment_complex" || t.district === "water_park"
  );

  const wonderSource = createSource("Wonder", wonders, 1);
  const entertainmentSource = createSource("Entertainment Complex / Water Park", entertainment, 2);

  if (wonderSource) sources.push(wonderSource);
  if (entertainmentSource) sources.push(entertainmentSource);

  return sources;
};

/**
 * Calculate Commercial Hub adjacency bonus.
 * +2 from harbors, +2 from rivers (if tile has river), +0.5 from districts
 */
const calculateCommercialHubAdjacency = (
  neighbors: Tile[],
  centerTile: Tile | undefined
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const harbors = countMatching(neighbors, (t) => t.district === "harbor");
  // River bonus is +2 if the district tile itself is adjacent to a river
  const hasRiverAdjacent = centerTile ? hasRiver(centerTile) : false;

  const harborSource = createSource("Harbor", harbors, 2);
  const riverSource = hasRiverAdjacent ? createSource("River", 1, 2) : null;

  if (harborSource) sources.push(harborSource);
  if (riverSource) sources.push(riverSource);

  return sources;
};

/**
 * Calculate Industrial Zone adjacency bonus.
 * +1 from mines, +1 from quarries, +2 from strategic resources with improvement, +0.5 from districts
 */
const calculateIndustrialZoneAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const mines = countMatching(neighbors, (t) => t.improvement === "mine");
  const quarries = countMatching(neighbors, (t) => t.improvement === "quarry");
  // Strategic resources with improvements (mine on iron, oil well on oil, etc.)
  const strategicWithImprovement = countMatching(
    neighbors,
    (t) =>
      t.resource?.type === "strategic" &&
      t.improvement !== undefined
  );

  const mineSource = createSource("Mine", mines, 1);
  const quarrySource = createSource("Quarry", quarries, 1);
  const strategicSource = createSource("Strategic Resource (improved)", strategicWithImprovement, 2);

  if (mineSource) sources.push(mineSource);
  if (quarrySource) sources.push(quarrySource);
  if (strategicSource) sources.push(strategicSource);

  return sources;
};

/**
 * Calculate Harbor adjacency bonus.
 * +2 from city center, +1 from other districts
 */
const calculateHarborAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  const cityCenters = countMatching(neighbors, (t) => t.district === "city_center");
  const otherDistricts = countMatching(
    neighbors,
    (t) =>
      t.district !== undefined &&
      t.district !== "city_center" &&
      ADJACENCY_PROVIDING_DISTRICTS.includes(t.district)
  );

  const cityCenterSource = createSource("City Center", cityCenters, 2);
  const districtSource = createSource("District", otherDistricts, 1);

  if (cityCenterSource) sources.push(cityCenterSource);
  if (districtSource) sources.push(districtSource);

  return sources;
};

/**
 * Calculate Encampment adjacency bonus.
 * Standard +0.5 from districts only
 */
const calculateEncampmentAdjacency = (): AdjacencySource[] => {
  // Encampment has no special adjacency bonuses beyond districts
  return [];
};

/**
 * Calculate Preserve adjacency bonus.
 * +1 per adjacent unimproved charming+ tile (based on appeal)
 * For simplicity, we'll count unimproved tiles with woods or next to mountains
 */
const calculatePreserveAdjacency = (
  neighbors: Tile[]
): AdjacencySource[] => {
  const sources: AdjacencySource[] = [];

  // Charming tiles: woods, next to coast/mountains, no improvements
  const charmingTiles = countMatching(
    neighbors,
    (t) =>
      t.improvement === undefined &&
      t.district === undefined &&
      (t.features.includes("woods") ||
        t.modifier === "mountain" ||
        t.terrain === "coast" ||
        t.features.includes("oasis"))
  );

  const charmingSource = createSource("Unimproved Charming Tile", charmingTiles, 1);
  if (charmingSource) sources.push(charmingSource);

  return sources;
};

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the standard district adjacency bonus.
 * Most districts get +0.5 from each adjacent district.
 *
 * @param neighbors - Neighboring tiles
 * @param districtBonusMultiplier - Bonus per district (default 0.5, Japan gets 1)
 * @returns District adjacency source, or null if no adjacent districts
 */
const calculateDistrictBonus = (
  neighbors: Tile[],
  districtBonusMultiplier: number = 0.5
): AdjacencySource | null => {
  const adjacentDistricts = countMatching(
    neighbors,
    (t) =>
      t.district !== undefined &&
      ADJACENCY_PROVIDING_DISTRICTS.includes(t.district)
  );

  return createSource("District", adjacentDistricts, districtBonusMultiplier);
};

/**
 * Calculate the extra bonus from adjacent Government Plaza.
 * Government Plaza is already counted in district adjacency (+0.5 per tile).
 * This adds the additional +1 per adjacent Government Plaza, for a total of +1.5 per plaza.
 *
 * @param neighbors - Neighboring tiles
 * @returns Government Plaza adjacency source, or null if none adjacent
 */
const calculateGovernmentPlazaBonus = (
  neighbors: Tile[]
): AdjacencySource | null => {
  const govPlazas = countMatching(neighbors, (t) => t.district === "government_plaza");
  return createSource("Government Plaza", govPlazas, 1);
};

/**
 * Calculate adjacency bonus for a specific district type at a given coordinate.
 *
 * @param coord - The hex coordinate to calculate adjacency for
 * @param district - The district type to calculate
 * @param tiles - Map of all tiles in the game
 * @param playerCiv - Optional player civilization for civ-specific bonuses
 * @returns Complete adjacency result with breakdown
 *
 * @example
 * const result = calculateAdjacency(
 *   { q: 3, r: -1 },
 *   "campus",
 *   gameStore.tiles,
 *   "korea"
 * );
 * console.log(`Campus adjacency: +${result.bonus}`);
 */
export const calculateAdjacency = (
  coord: HexCoord,
  district: DistrictType,
  tiles: Map<string, Tile>,
  playerCiv?: string
): AdjacencyResult => {
  const neighbors = getNeighborTiles(coord, tiles);
  const centerTile = tiles.get(coordKey(coord));
  const sources: AdjacencySource[] = [];

  // Get civ-specific modifiers
  const civModifiers = getCivModifiers(playerCiv);
  const districtBonusMultiplier = civModifiers.districtBonusMultiplier;

  // Calculate district-specific bonuses
  switch (district) {
    case "campus":
      sources.push(...calculateCampusAdjacency(neighbors));
      // Maya Observatory: Farms and Plantations
      if (civModifiers.customDistricts.campus) {
        for (const extra of civModifiers.customDistricts.campus.extraSources) {
          const count = countMatching(neighbors, extra.match);
          const extraSource = createSource(extra.source, count, extra.bonusPerSource);
          if (extraSource) sources.push(extraSource);
        }
      }
      break;
    case "holy_site":
      sources.push(...calculateHolySiteAdjacency(neighbors));
      // Brazil: Rainforest provides +1 to Holy Site
      if (civModifiers.featureBonuses.rainforest_holy_site) {
        const rainforest = countMatching(neighbors, (t) => t.features.includes("rainforest"));
        const brazilRainforest = createSource(
          "Rainforest (Brazil)",
          rainforest,
          civModifiers.featureBonuses.rainforest_holy_site
        );
        if (brazilRainforest) sources.push(brazilRainforest);
      }
      break;
    case "theater_square":
      sources.push(...calculateTheaterSquareAdjacency(neighbors));
      // Brazil: Rainforest provides +1 to Theater Square
      if (civModifiers.featureBonuses.rainforest_theater_square) {
        const rainforest = countMatching(neighbors, (t) => t.features.includes("rainforest"));
        const brazilRainforest = createSource(
          "Rainforest (Brazil)",
          rainforest,
          civModifiers.featureBonuses.rainforest_theater_square
        );
        if (brazilRainforest) sources.push(brazilRainforest);
      }
      break;
    case "commercial_hub":
      sources.push(...calculateCommercialHubAdjacency(neighbors, centerTile));
      // Brazil: Rainforest provides +1 to Commercial Hub
      if (civModifiers.featureBonuses.rainforest_commercial_hub) {
        const rainforest = countMatching(neighbors, (t) => t.features.includes("rainforest"));
        const brazilRainforest = createSource(
          "Rainforest (Brazil)",
          rainforest,
          civModifiers.featureBonuses.rainforest_commercial_hub
        );
        if (brazilRainforest) sources.push(brazilRainforest);
      }
      break;
    case "industrial_zone":
      sources.push(...calculateIndustrialZoneAdjacency(neighbors));
      // Germany Hansa: +2 from Commercial Hub, +1 from resources
      if (civModifiers.customDistricts.industrial_zone) {
        for (const extra of civModifiers.customDistricts.industrial_zone.extraSources) {
          const count = countMatching(neighbors, extra.match);
          const extraSource = createSource(extra.source, count, extra.bonusPerSource);
          if (extraSource) sources.push(extraSource);
        }
      }
      break;
    case "harbor":
      // Harbor has special adjacency rules - calculated separately
      {
        const harborSources = calculateHarborAdjacency(neighbors);
        return {
          district,
          bonus: Math.floor(harborSources.reduce((sum, s) => sum + s.totalBonus, 0)),
          breakdown: harborSources,
        };
      }
    case "encampment":
      sources.push(...calculateEncampmentAdjacency());
      break;
    case "preserve":
      sources.push(...calculatePreserveAdjacency(neighbors));
      break;
    case "government_plaza":
      // Government Plaza doesn't receive adjacency bonuses
      return { district, bonus: 0, breakdown: [] };
    default:
      // For other districts, only standard district adjacency applies
      break;
  }

  // Add standard district adjacency bonus (except for harbor which has special rules)
  if (district !== "harbor" && STANDARD_DISTRICTS.includes(district)) {
    const districtSource = calculateDistrictBonus(neighbors, districtBonusMultiplier);
    if (districtSource) sources.push(districtSource);
  }

  // Add Government Plaza bonus if adjacent
  const govPlazaBonus = calculateGovernmentPlazaBonus(neighbors);
  if (govPlazaBonus) sources.push(govPlazaBonus);

  // Calculate total bonus (floor of sum of each source's totalBonus for consistent summation)
  const rawTotal = sources.reduce((sum, s) => sum + s.totalBonus, 0);
  const bonus = Math.floor(rawTotal);

  return {
    district,
    bonus,
    breakdown: sources,
  };
};

/**
 * Calculate adjacency bonuses for all district types at a given coordinate.
 *
 * @param coord - The hex coordinate to calculate adjacencies for
 * @param tiles - Map of all tiles in the game
 * @param playerCiv - Optional player civilization for civ-specific bonuses
 * @returns Array of adjacency results for all district types, sorted by bonus descending
 *
 * @example
 * const results = calculateAllAdjacencies({ q: 3, r: -1 }, gameStore.tiles);
 * const bestDistrict = results[0]; // Highest adjacency bonus
 */
export const calculateAllAdjacencies = (
  coord: HexCoord,
  tiles: Map<string, Tile>,
  playerCiv?: string
): AdjacencyResult[] => {
  // Districts to calculate adjacency for
  const districtsToCalculate: DistrictType[] = [
    "campus",
    "holy_site",
    "theater_square",
    "commercial_hub",
    "industrial_zone",
    "harbor",
    "encampment",
    "entertainment_complex",
    "preserve",
  ];

  const results = districtsToCalculate.map((district) =>
    calculateAdjacency(coord, district, tiles, playerCiv)
  );

  // Sort by bonus descending
  return results.sort((a, b) => b.bonus - a.bonus);
};

/**
 * Get the display name for a district type.
 *
 * @param district - District type
 * @returns Human-readable display name
 */
export const getDistrictDisplayName = (district: DistrictType): string => {
  const names: Record<DistrictType, string> = {
    city_center: "City Center",
    campus: "Campus",
    holy_site: "Holy Site",
    theater_square: "Theater Square",
    commercial_hub: "Commercial Hub",
    harbor: "Harbor",
    industrial_zone: "Industrial Zone",
    encampment: "Encampment",
    entertainment_complex: "Entertainment Complex",
    water_park: "Water Park",
    aerodrome: "Aerodrome",
    spaceport: "Spaceport",
    government_plaza: "Government Plaza",
    diplomatic_quarter: "Diplomatic Quarter",
    neighborhood: "Neighborhood",
    aqueduct: "Aqueduct",
    dam: "Dam",
    canal: "Canal",
    preserve: "Preserve",
  };
  return names[district] || district;
};

/**
 * Get the color for an adjacency bonus value.
 * Used for visual indicators on the map.
 *
 * @param bonus - The adjacency bonus value
 * @returns CSS color string
 */
export const getAdjacencyColor = (bonus: number): string => {
  if (bonus <= 0) return "#6b7280"; // Gray
  if (bonus <= 2) return "#eab308"; // Yellow
  if (bonus <= 4) return "#f97316"; // Orange
  return "#22c55e"; // Green (5+)
};

/**
 * Get a rating label for an adjacency bonus.
 *
 * @param bonus - The adjacency bonus value
 * @returns Rating string (Poor, Decent, Good, Excellent)
 */
export const getAdjacencyRating = (bonus: number): string => {
  if (bonus <= 0) return "Poor";
  if (bonus <= 2) return "Decent";
  if (bonus <= 4) return "Good";
  return "Excellent";
};
