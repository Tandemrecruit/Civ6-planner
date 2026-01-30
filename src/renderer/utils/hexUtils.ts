import { HexCoord } from "../../types/model";

// Hex size (distance from center to corner)
export const HEX_SIZE = 40;

// Flat-top hex dimensions
export const HEX_WIDTH = HEX_SIZE * 2;
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

// Horizontal and vertical spacing between hex centers
export const HEX_HORIZ_SPACING = HEX_WIDTH * 0.75;
export const HEX_VERT_SPACING = HEX_HEIGHT;

/**
 * Convert axial coordinates to pixel position (flat-top hexes)
 */
export const hexToPixel = (coord: HexCoord): { x: number; y: number } => {
  const x = HEX_SIZE * (3 / 2) * coord.q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
};

/**
 * Convert pixel position to axial coordinates (flat-top hexes)
 */
export const pixelToHex = (x: number, y: number): HexCoord => {
  const q = (2 / 3 * x) / HEX_SIZE;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
  return hexRound({ q, r });
};

/**
 * Round fractional hex coordinates to nearest hex
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

/**
 * Get the 6 corners of a hex for drawing (flat-top orientation)
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

/**
 * Get neighboring hex coordinates
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
 * Calculate distance between two hexes
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
 * Get all hexes within a certain range of a center hex
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

/**
 * Get terrain color - more distinct colors for each terrain type
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
 * Get hills indicator color (used for pattern overlay)
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

/**
 * Get feature overlay color/pattern - more vibrant colors
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
 * Get feature icon for display
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

/**
 * Get district icon/label
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
 * Get improvement icon/label
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

/**
 * Get resource type color
 */
export const getResourceColor = (type: string): string => {
  const colors: Record<string, string> = {
    luxury: "#a855f7",    // Purple
    strategic: "#ef4444", // Red
    bonus: "#22c55e",     // Green
  };
  return colors[type] || "#6b7280";
};

/**
 * Get the points for a river edge segment
 * Edge index: 0=E (30°), 1=SE (90°), 2=SW (150°), 3=W (210°), 4=NW (270°), 5=NE (330°)
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
