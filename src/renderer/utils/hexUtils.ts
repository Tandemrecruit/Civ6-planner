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
 * Get terrain color
 */
export const getTerrainColor = (terrain: string, modifier?: string): string => {
  if (modifier === "mountain") return "#6b7280";

  const colors: Record<string, string> = {
    grassland: "#4ade80",
    plains: "#fbbf24",
    desert: "#fcd34d",
    tundra: "#9ca3af",
    snow: "#e5e7eb",
    coast: "#38bdf8",
    ocean: "#0ea5e9",
  };

  let baseColor = colors[terrain] || "#6b7280";

  // Darken for hills
  if (modifier === "hills") {
    baseColor = darkenColor(baseColor, 15);
  }

  return baseColor;
};

/**
 * Darken a hex color by a percentage
 */
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

/**
 * Get feature overlay color/pattern
 */
export const getFeatureColor = (feature: string): string | null => {
  const colors: Record<string, string> = {
    woods: "rgba(34, 139, 34, 0.4)",
    rainforest: "rgba(0, 100, 0, 0.5)",
    marsh: "rgba(107, 142, 35, 0.4)",
    floodplains: "rgba(210, 180, 140, 0.3)",
    reef: "rgba(0, 206, 209, 0.4)",
    geothermal: "rgba(255, 69, 0, 0.4)",
    volcanic_soil: "rgba(139, 69, 19, 0.3)",
    oasis: "rgba(0, 191, 255, 0.5)",
  };
  return colors[feature] || null;
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
