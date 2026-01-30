/**
 * @fileoverview Hex grid utility functions for coordinate math and rendering.
 *
 * This module provides all the mathematical functions needed for working with
 * hexagonal grids, including coordinate conversion, neighbor calculation, and
 * visual styling. Uses flat-top hex orientation with axial coordinates.
 *
 * @module renderer/utils/hexUtils
 * @see https://www.redblobgames.com/grids/hexagons/ - Reference implementation guide
 */

import { HexCoord } from "../../types/model";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Hex size in pixels (distance from center to corner vertex).
 * All other dimensions derive from this value.
 */
export const HEX_SIZE = 40;

/**
 * Width of a flat-top hex (point to point horizontally).
 * Equals 2 * HEX_SIZE.
 */
export const HEX_WIDTH = HEX_SIZE * 2;

/**
 * Height of a flat-top hex (flat edge to flat edge).
 * Equals sqrt(3) * HEX_SIZE.
 */
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

/**
 * Horizontal spacing between hex centers in a grid.
 * Hexes overlap by 1/4 of their width horizontally.
 */
export const HEX_HORIZ_SPACING = HEX_WIDTH * 0.75;

/**
 * Vertical spacing between hex centers in a grid.
 * Same as HEX_HEIGHT for flat-top orientation.
 */
export const HEX_VERT_SPACING = HEX_HEIGHT;

// ============================================================================
// COORDINATE CONVERSION
// ============================================================================

/**
 * Convert axial hex coordinates to pixel position (flat-top hexes).
 *
 * Uses the standard flat-top hex conversion formula where:
 * - x = size * 3/2 * q
 * - y = size * sqrt(3) * (q/2 + r)
 *
 * @param coord - Axial coordinates to convert
 * @returns Pixel position {x, y} for the hex center
 *
 * @example
 * const pixel = hexToPixel({ q: 2, r: 1 });
 * // Returns { x: 120, y: 103.92... }
 *
 * @example
 * // Use for SVG positioning
 * const { x, y } = hexToPixel(tile.coord);
 * return <circle cx={x} cy={y} r={5} />;
 */
export const hexToPixel = (coord: HexCoord): { x: number; y: number } => {
  const x = HEX_SIZE * (3 / 2) * coord.q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
};

/**
 * Convert pixel position to axial hex coordinates (flat-top hexes).
 *
 * Converts screen/SVG coordinates back to the hex grid coordinate system.
 * Automatically rounds to the nearest hex using {@link hexRound}.
 *
 * @param x - X pixel coordinate
 * @param y - Y pixel coordinate
 * @returns Axial coordinates of the hex containing this pixel
 *
 * @example
 * // Convert a click position to hex coordinates
 * const handleClick = (e: MouseEvent) => {
 *   const hex = pixelToHex(e.clientX - offset.x, e.clientY - offset.y);
 *   selectTile(hex);
 * };
 */
export const pixelToHex = (x: number, y: number): HexCoord => {
  const q = (2 / 3 * x) / HEX_SIZE;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
  return hexRound({ q, r });
};

/**
 * Round fractional hex coordinates to the nearest integer hex.
 *
 * Uses cube coordinate rounding for accuracy: converts to cube coords,
 * rounds each component, then adjusts the component with the largest
 * rounding error to maintain the cube coordinate constraint (q + r + s = 0).
 *
 * @param coord - Fractional axial coordinates to round
 * @returns Integer axial coordinates of the nearest hex
 *
 * @example
 * hexRound({ q: 1.3, r: 0.8 });  // Returns { q: 1, r: 1 }
 * hexRound({ q: -0.4, r: 2.1 }); // Returns { q: 0, r: 2 }
 */
export const hexRound = (coord: { q: number; r: number }): HexCoord => {
  const s = -coord.q - coord.r;

  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
};

// ============================================================================
// GEOMETRY
// ============================================================================

/**
 * Get the 6 corner vertices of a hex as an SVG polygon points string.
 *
 * Generates corners for flat-top orientation starting from the right
 * (0 degrees) and going clockwise.
 *
 * @param center - Pixel position of the hex center
 * @returns SVG points string for use in <polygon points="...">
 *
 * @example
 * const { x, y } = hexToPixel(tile.coord);
 * const points = hexCorners({ x, y });
 * return <polygon points={points} fill="green" />;
 */
export const hexCorners = (center: { x: number; y: number }): string => {
  const corners: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = center.x + HEX_SIZE * Math.cos(angleRad);
    const y = center.y + HEX_SIZE * Math.sin(angleRad);
    corners.push(`${x},${y}`);
  }
  return corners.join(" ");
};

// ============================================================================
// NEIGHBORS & DISTANCE
// ============================================================================

/**
 * Get the 6 neighboring hex coordinates around a center hex.
 *
 * Returns neighbors in clockwise order starting from East:
 * E, NE, NW, W, SW, SE
 *
 * @param coord - Center hex coordinates
 * @returns Array of 6 neighboring hex coordinates
 *
 * @example
 * const neighbors = hexNeighbors({ q: 0, r: 0 });
 * // Returns coordinates for all 6 adjacent hexes
 *
 * @example
 * // Check if a tile has adjacent mountains
 * const hasAdjacentMountain = hexNeighbors(tile.coord)
 *   .map(c => tiles.get(coordKey(c)))
 *   .some(t => t?.modifier === "mountain");
 */
export const hexNeighbors = (coord: HexCoord): HexCoord[] => {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },   // East
    { q: 1, r: -1 },  // Northeast
    { q: 0, r: -1 },  // Northwest
    { q: -1, r: 0 },  // West
    { q: -1, r: 1 },  // Southwest
    { q: 0, r: 1 },   // Southeast
  ];
  return directions.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
};

/**
 * Calculate the distance between two hexes in hex steps.
 *
 * Uses the Manhattan distance formula for hex grids:
 * distance = (|Δq| + |Δq + Δr| + |Δr|) / 2
 *
 * @param a - First hex coordinates
 * @param b - Second hex coordinates
 * @returns Number of hex steps between the two hexes
 *
 * @example
 * hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 }); // Returns 2
 * hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 });  // Returns 3
 */
export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
};

/**
 * Get all hexes within a certain range of a center hex (inclusive).
 *
 * Returns hexes in a filled hexagonal area. The center hex is included
 * when range >= 0.
 *
 * @param center - Center hex coordinates
 * @param range - Maximum distance from center (0 = just center, 1 = center + 6 neighbors, etc.)
 * @returns Array of all hex coordinates within range
 *
 * @example
 * // Get all hexes within 2 tiles of a city
 * const cityArea = hexesInRange(city.location, 2);
 * // Returns 19 hexes (1 + 6 + 12)
 *
 * @example
 * // Get a city's workable tiles (3-tile radius)
 * const workable = hexesInRange(city.location, 3);
 */
export const hexesInRange = (center: HexCoord, range: number): HexCoord[] => {
  const results: HexCoord[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
};

// ============================================================================
// STYLING - TERRAIN
// ============================================================================

/**
 * Get the fill color for a terrain type.
 *
 * Returns a distinct color for each terrain type to make the map
 * easily readable. Mountains override the base terrain color.
 *
 * @param terrain - Terrain type name
 * @param modifier - Optional terrain modifier (hills, mountain)
 * @returns CSS color string (hex format)
 *
 * @example
 * const fill = getTerrainColor("grassland");        // "#22c55e"
 * const fill = getTerrainColor("plains", "hills"); // "#eab308"
 * const fill = getTerrainColor("desert", "mountain"); // "#374151"
 */
export const getTerrainColor = (terrain: string, modifier?: string): string => {
  if (modifier === "mountain") return "#374151"; // Dark gray for mountains

  const colors: Record<string, string> = {
    grassland: "#22c55e", // Bright green
    plains: "#eab308",    // Golden yellow
    desert: "#f59e0b",    // Orange-yellow (more distinct from plains)
    tundra: "#6b7280",    // Gray
    snow: "#e2e8f0",      // Light gray-white
    coast: "#38bdf8",     // Light blue
    ocean: "#0369a1",     // Dark blue
  };

  return colors[terrain] || "#6b7280";
};

/**
 * Get a darker variant of terrain color for hills pattern overlay.
 *
 * Used to draw triangular hills indicators that contrast with
 * the base terrain color.
 *
 * @param terrain - Terrain type name
 * @returns CSS color string (hex format)
 *
 * @example
 * const patternColor = getHillsPatternColor("grassland"); // "#15803d"
 */
export const getHillsPatternColor = (terrain: string): string => {
  const colors: Record<string, string> = {
    grassland: "#15803d", // Darker green
    plains: "#a16207",    // Darker gold
    desert: "#b45309",    // Darker orange
    tundra: "#4b5563",    // Darker gray
    snow: "#94a3b8",      // Medium gray
    coast: "#0284c7",     // Darker blue
    ocean: "#075985",     // Even darker blue
  };
  return colors[terrain] || "#374151";
};

// ============================================================================
// STYLING - FEATURES
// ============================================================================

/**
 * Get the overlay color for a natural feature.
 *
 * Returns semi-transparent colors that overlay on terrain
 * to indicate features like woods, marshes, etc.
 *
 * @param feature - Feature type name
 * @returns CSS rgba color string, or null if unknown feature
 *
 * @example
 * const overlay = getFeatureColor("woods"); // "rgba(22, 101, 52, 0.55)"
 * const overlay = getFeatureColor("unknown"); // null
 */
export const getFeatureColor = (feature: string): string | null => {
  const colors: Record<string, string> = {
    woods: "rgba(22, 101, 52, 0.55)",       // Forest green
    rainforest: "rgba(5, 80, 35, 0.6)",     // Dark jungle green
    marsh: "rgba(132, 204, 22, 0.45)",      // Yellow-green
    floodplains: "rgba(251, 191, 36, 0.35)", // Golden
    reef: "rgba(6, 182, 212, 0.5)",         // Cyan
    geothermal: "rgba(239, 68, 68, 0.5)",   // Red
    volcanic_soil: "rgba(120, 53, 15, 0.45)", // Brown
    oasis: "rgba(34, 211, 238, 0.6)",       // Bright cyan
    cliffs: "rgba(71, 85, 105, 0.5)",       // Slate
  };
  return colors[feature] || null;
};

/**
 * Get the emoji icon for a natural feature.
 *
 * @param feature - Feature type name
 * @returns Emoji string representing the feature, or empty string if unknown
 *
 * @example
 * getFeatureIcon("woods");      // "🌲"
 * getFeatureIcon("rainforest"); // "🌴"
 */
export const getFeatureIcon = (feature: string): string => {
  const icons: Record<string, string> = {
    woods: "🌲",
    rainforest: "🌴",
    marsh: "🌿",
    floodplains: "〰️",
    reef: "🐠",
    geothermal: "♨️",
    volcanic_soil: "🌋",
    oasis: "🏝️",
    cliffs: "🪨",
  };
  return icons[feature] || "";
};

// ============================================================================
// STYLING - DISTRICTS & IMPROVEMENTS
// ============================================================================

/**
 * Get the emoji icon for a district type.
 *
 * @param district - District type name (e.g., "campus", "industrial_zone")
 * @returns Emoji string representing the district, or "?" if unknown
 *
 * @example
 * getDistrictLabel("campus");          // "🔬"
 * getDistrictLabel("industrial_zone"); // "🏭"
 */
export const getDistrictLabel = (district: string): string => {
  const labels: Record<string, string> = {
    city_center: "🏛️",
    campus: "🔬",
    holy_site: "⛪",
    theater_square: "🎭",
    commercial_hub: "🏪",
    harbor: "⚓",
    industrial_zone: "🏭",
    encampment: "⚔️",
    entertainment_complex: "🎪",
    water_park: "🌊",
    aerodrome: "✈️",
    spaceport: "🚀",
    government_plaza: "🏰",
    diplomatic_quarter: "🤝",
    neighborhood: "🏘️",
    aqueduct: "💧",
    dam: "🌊",
    canal: "🚢",
    preserve: "🌲",
  };
  return labels[district] || "?";
};

/**
 * Get the emoji icon for a tile improvement.
 *
 * @param improvement - Improvement type name (e.g., "farm", "mine")
 * @returns Emoji string representing the improvement, or "?" if unknown
 *
 * @example
 * getImprovementLabel("farm");    // "🌾"
 * getImprovementLabel("mine");    // "⛏️"
 * getImprovementLabel("pasture"); // "🐄"
 */
export const getImprovementLabel = (improvement: string): string => {
  const labels: Record<string, string> = {
    farm: "🌾",
    mine: "⛏️",
    quarry: "🪨",
    plantation: "🍃",
    camp: "🏕️",
    pasture: "🐄",
    fishing_boats: "🎣",
    lumber_mill: "🪵",
    oil_well: "🛢️",
    offshore_platform: "🛢️",
    seaside_resort: "🏖️",
    ski_resort: "⛷️",
    fort: "🏰",
    airstrip: "🛫",
    missile_silo: "🚀",
  };
  return labels[improvement] || "?";
};

// ============================================================================
// STYLING - RESOURCES
// ============================================================================

/**
 * Get the indicator color for a resource type.
 *
 * Used for the small resource indicator circles on tiles.
 *
 * @param type - Resource type ("luxury", "strategic", "bonus")
 * @returns CSS color string (hex format)
 *
 * @example
 * getResourceColor("luxury");    // "#a855f7" (purple)
 * getResourceColor("strategic"); // "#ef4444" (red)
 * getResourceColor("bonus");     // "#22c55e" (green)
 */
export const getResourceColor = (type: string): string => {
  const colors: Record<string, string> = {
    luxury: "#a855f7",    // Purple
    strategic: "#ef4444", // Red
    bonus: "#22c55e",     // Green
  };
  return colors[type] || "#6b7280";
};

// ============================================================================
// STYLING - RIVERS
// ============================================================================

/**
 * Get SVG points for a river edge segment on a hex.
 *
 * Returns two points defining a line segment along one edge of the hex.
 * Used to draw river graphics between hex tiles.
 *
 * Edge indices (flat-top hex, clockwise from right):
 * - 0: East (E) - from 0° to 60°
 * - 1: Southeast (SE) - from 60° to 120°
 * - 2: Southwest (SW) - from 120° to 180°
 * - 3: West (W) - from 180° to 240°
 * - 4: Northwest (NW) - from 240° to 300°
 * - 5: Northeast (NE) - from 300° to 360°
 *
 * @param center - Pixel position of the hex center
 * @param edgeIndex - Edge index (0-5)
 * @returns SVG points string "x1,y1 x2,y2" for use in <polyline>
 *
 * @example
 * // Draw a river on the east edge
 * const points = getRiverEdgePoints({ x: 100, y: 100 }, 0);
 * return <polyline points={points} stroke="blue" />;
 */
export const getRiverEdgePoints = (
  center: { x: number; y: number },
  edgeIndex: number
): string => {
  const startAngle = 60 * edgeIndex;
  const endAngle = 60 * ((edgeIndex + 1) % 6);

  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;

  const x1 = center.x + HEX_SIZE * Math.cos(startRad);
  const y1 = center.y + HEX_SIZE * Math.sin(startRad);
  const x2 = center.x + HEX_SIZE * Math.cos(endRad);
  const y2 = center.y + HEX_SIZE * Math.sin(endRad);

  return `${x1},${y1} ${x2},${y2}`;
};
