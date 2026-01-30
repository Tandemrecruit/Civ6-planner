/**
 * @fileoverview Interactive hexagonal grid map component.
 *
 * This component renders the main game map as an SVG hex grid with
 * pan/zoom navigation. It displays tiles with terrain, features,
 * districts, improvements, and planning indicators.
 *
 * @module renderer/components/HexGrid
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useGameStore } from "../store";
import { HexCoord, Tile, DistrictType, coordKey } from "../../types/model";
import {
  hexToPixel,
  pixelToHex,
  hexCorners,
  getTerrainColor,
  getFeatureColor,
  getDistrictLabel,
  getImprovementLabel,
  getHillsPatternColor,
  getResourceColor,
  getRiverEdgePoints,
  HEX_SIZE,
} from "../utils/hexUtils";
import {
  calculateAdjacency,
  getAdjacencyColor,
} from "../utils/adjacencyCalculator";
import "./HexGrid.css";

/**
 * Props for the HexGrid component.
 */
interface HexGridProps {
  /**
   * Callback fired when a tile is clicked.
   * Receives the hex coordinates and the tile data (or null for empty hexes).
   */
  onTileSelect: (coord: HexCoord, tile: Tile | null) => void;

  /**
   * Currently selected tile coordinates, used for highlighting.
   * Pass null when no tile is selected.
   */
  selectedTile: HexCoord | null;

  /**
   * District type to show adjacency overlay for.
   * When set to a district type, shows color-coded adjacency bonuses on valid tiles.
   * Pass null or undefined to disable overlay.
   */
  overlayDistrict?: DistrictType | null;
}

/**
 * Interactive SVG hex grid map with pan/zoom navigation.
 *
 * Features:
 * - Renders all tiles from the game store with terrain, features, and overlays
 * - Mouse wheel zoom (centered on cursor position)
 * - Pan via middle-click drag or shift+left-click drag
 * - Click to select tiles (existing or empty grid positions)
 * - Visual indicators for districts, improvements, resources, rivers, and plans
 * - Grid guide overlay showing empty hex positions
 *
 * @param props - Component props
 * @param props.onTileSelect - Callback when a tile is clicked
 * @param props.selectedTile - Currently selected tile for highlighting
 *
 * @example
 * const [selected, setSelected] = useState<HexCoord | null>(null);
 *
 * const handleSelect = (coord: HexCoord, tile: Tile | null) => {
 *   setSelected(coord);
 *   // Open tile inspector, etc.
 * };
 *
 * return <HexGrid onTileSelect={handleSelect} selectedTile={selected} />;
 */
const HexGrid: React.FC<HexGridProps> = ({ onTileSelect, selectedTile, overlayDistrict }) => {
  const { tiles, cities, setup } = useGameStore();
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and zoom state
  const [viewBox, setViewBox] = useState({ x: -300, y: -300, w: 800, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle click or shift+left click to pan
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      // Scale movement by current zoom level
      const scale = viewBox.w / (svgRef.current?.clientWidth || 800);

      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx * scale,
        y: prev.y - dy * scale,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox.w]
  );

  // Handle mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add/remove global mouse listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Handle zoom with native event listener (passive: false to allow preventDefault)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouse position to SVG coordinates
      const svgX = viewBox.x + (mouseX / rect.width) * viewBox.w;
      const svgY = viewBox.y + (mouseY / rect.height) * viewBox.h;

      // Zoom factor
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newW = Math.max(200, Math.min(3000, viewBox.w * zoomFactor));
      const newH = Math.max(150, Math.min(2250, viewBox.h * zoomFactor));

      // Adjust position to zoom toward mouse
      const newX = svgX - (mouseX / rect.width) * newW;
      const newY = svgY - (mouseY / rect.height) * newH;

      setViewBox({ x: newX, y: newY, w: newW, h: newH });
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [viewBox]);

  // Handle click on SVG (for adding new tiles or selecting)
  const handleClick = (e: React.MouseEvent) => {
    if (isPanning) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to SVG coordinates
    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.w;
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.h;

    // Convert to hex coordinates
    const hexCoord = pixelToHex(svgX, svgY);
    const key = coordKey(hexCoord);
    const tile = tiles.get(key) || null;

    onTileSelect(hexCoord, tile);
  };

  // Render a single hex
  const renderHex = (tile: Tile) => {
    const { x, y } = hexToPixel(tile.coord);
    const points = hexCorners({ x, y });
    const key = coordKey(tile.coord);
    const isSelected =
      selectedTile && selectedTile.q === tile.coord.q && selectedTile.r === tile.coord.r;

    const terrainColor = getTerrainColor(tile.terrain, tile.modifier);
    const featureColor = tile.features.length > 0 ? getFeatureColor(tile.features[0]) : null;
    const isMountain = tile.modifier === "mountain";
    const isHills = tile.modifier === "hills";

    // Check if this tile has a city center
    const city = cities.find(
      (c) => c.location.q === tile.coord.q && c.location.r === tile.coord.r
    );

    // Check for planned states
    const hasPlans = tile.plannedStates.length > 0;

    // Hills pattern - create triangular indicators
    const hillsPatternColor = isHills ? getHillsPatternColor(tile.terrain) : null;

    // Feature icons mapping
    const featureIcons: Record<string, string> = {
      woods: "🌲",
      rainforest: "🌴",
      marsh: "🌿",
      floodplains: "〰️",
      reef: "🪸",
      geothermal: "♨️",
      volcanic_soil: "🌋",
      oasis: "🏝️",
      cliffs: "🧗",
    };

    // Determine what icon to show (priority: district > improvement > feature)
    const hasDistrict = !!tile.district;
    const hasImprovement = !!tile.improvement;
    const primaryFeature = tile.features.length > 0 ? tile.features[0] : null;

    const featureIcon = primaryFeature ? featureIcons[primaryFeature] : undefined;
    
    // Show feature graphics only when no district/improvement to avoid overlap
    const showFeatureGraphics = primaryFeature && !hasDistrict && !hasImprovement && !isMountain;
    // Show feature emoji icon only when graphics are hidden (i.e., when district/improvement present)
    const showFeatureIcon = primaryFeature && (hasDistrict || hasImprovement) && !isMountain;

    return (
      <g key={key} className="hex-tile">
        {/* Base terrain */}
        <polygon
          points={points}
          fill={terrainColor}
          stroke={isSelected ? "#C6A664" : "#2d3748"}
          strokeWidth={isSelected ? 3 : 2}
          className="hex-polygon"
        />

        {/* Feature overlay - different patterns for different features */}
        {showFeatureGraphics && featureColor && (
          <polygon points={points} fill={featureColor} pointerEvents="none" />
        )}

        {/* Feature-specific patterns for better differentiation - only show when no district/improvement */}
        {showFeatureGraphics && primaryFeature === "floodplains" && (
          <g pointerEvents="none" opacity={0.6}>
            {/* Wavy lines pattern for floodplains */}
            <path
              d={`M ${x - 20} ${y - 5} q 5 -5 10 0 t 10 0 t 10 0`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d={`M ${x - 20} ${y + 5} q 5 -5 10 0 t 10 0 t 10 0`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "marsh" && (
          <g pointerEvents="none" opacity={0.7}>
            {/* Reed/grass lines for marsh */}
            <line x1={x - 8} y1={y + 10} x2={x - 10} y2={y - 5} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x - 3} y1={y + 10} x2={x - 4} y2={y - 8} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x + 3} y1={y + 10} x2={x + 2} y2={y - 6} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x + 8} y1={y + 10} x2={x + 10} y2={y - 4} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "woods" && (
          <g pointerEvents="none">
            {/* Tree symbols for woods */}
            <polygon points={`${x - 10},${y + 8} ${x - 5},${y - 6} ${x},${y + 8}`} fill="#166534" />
            <polygon points={`${x + 2},${y + 8} ${x + 7},${y - 8} ${x + 12},${y + 8}`} fill="#15803d" />
            <rect x={x - 6} y={y + 8} width={2} height={4} fill="#78350f" />
            <rect x={x + 6} y={y + 8} width={2} height={4} fill="#78350f" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "rainforest" && (
          <g pointerEvents="none">
            {/* Dense tree symbols for rainforest */}
            <polygon points={`${x - 12},${y + 8} ${x - 6},${y - 8} ${x},${y + 8}`} fill="#14532d" />
            <polygon points={`${x - 4},${y + 6} ${x + 2},${y - 10} ${x + 8},${y + 6}`} fill="#166534" />
            <polygon points={`${x + 4},${y + 8} ${x + 10},${y - 6} ${x + 16},${y + 8}`} fill="#15803d" />
            {/* Palm frond accent */}
            <ellipse cx={x + 2} cy={y - 8} rx={4} ry={2} fill="#22c55e" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "geothermal" && (
          <g pointerEvents="none">
            {/* Steam/heat waves */}
            <path
              d={`M ${x - 5} ${y + 5} q -2 -8 2 -15`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d={`M ${x + 5} ${y + 5} q 2 -8 -2 -15`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={x} cy={y + 8} r={6} fill="#dc2626" opacity={0.6} />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "oasis" && (
          <g pointerEvents="none">
            {/* Water pool with palm */}
            <ellipse cx={x} cy={y + 4} rx={12} ry={6} fill="#0ea5e9" opacity={0.7} />
            <polygon points={`${x + 8},${y + 6} ${x + 12},${y - 10} ${x + 16},${y + 6}`} fill="#16a34a" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "reef" && (
          <g pointerEvents="none" opacity={0.8}>
            {/* Coral dots pattern */}
            <circle cx={x - 8} cy={y - 4} r={4} fill="#f472b6" />
            <circle cx={x + 6} cy={y - 2} r={3} fill="#fb923c" />
            <circle cx={x - 2} cy={y + 6} r={4} fill="#a78bfa" />
            <circle cx={x + 10} cy={y + 4} r={3} fill="#4ade80" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "volcanic_soil" && (
          <g pointerEvents="none" opacity={0.6}>
            {/* Dark soil patches */}
            <ellipse cx={x - 8} cy={y} rx={6} ry={4} fill="#44403c" />
            <ellipse cx={x + 6} cy={y + 4} rx={8} ry={4} fill="#292524" />
            <ellipse cx={x} cy={y - 6} rx={5} ry={3} fill="#44403c" />
          </g>
        )}

        {showFeatureGraphics && primaryFeature === "cliffs" && (
          <g pointerEvents="none">
            {/* Rocky cliff face */}
            <polygon points={`${x - 15},${y + 10} ${x - 10},${y - 8} ${x - 5},${y + 10}`} fill="#64748b" />
            <polygon points={`${x - 8},${y + 10} ${x},${y - 10} ${x + 8},${y + 10}`} fill="#475569" />
            <polygon points={`${x + 5},${y + 10} ${x + 12},${y - 6} ${x + 18},${y + 10}`} fill="#64748b" />
          </g>
        )}

        {/* Hills indicator - triangular pattern at bottom (hide when feature graphics shown to avoid overlap) */}
        {isHills && !showFeatureGraphics && (
          <>
            {/* Three small triangles to indicate elevation */}
            <polygon
              points={`${x - 12},${y + 8} ${x - 6},${y - 2} ${x},${y + 8}`}
              fill={hillsPatternColor!}
              opacity={0.8}
              pointerEvents="none"
            />
            <polygon
              points={`${x - 2},${y + 8} ${x + 4},${y - 2} ${x + 10},${y + 8}`}
              fill={hillsPatternColor!}
              opacity={0.8}
              pointerEvents="none"
            />
            {/* Subtle highlight on top edge of triangles */}
            <line
              x1={x - 12} y1={y + 8}
              x2={x - 6} y2={y - 2}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              pointerEvents="none"
            />
            <line
              x1={x - 2} y1={y + 8}
              x2={x + 4} y2={y - 2}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              pointerEvents="none"
            />
          </>
        )}

        {/* Mountain indicator - larger triangle with snow cap */}
        {isMountain && (
          <>
            <polygon
              points={`${x - 16},${y + 12} ${x},${y - 14} ${x + 16},${y + 12}`}
              fill="#4b5563"
              stroke="#374151"
              strokeWidth={1}
              pointerEvents="none"
            />
            {/* Snow cap */}
            <polygon
              points={`${x - 5},${y - 4} ${x},${y - 14} ${x + 5},${y - 4}`}
              fill="#e5e7eb"
              pointerEvents="none"
            />
          </>
        )}

        {/* River edges */}
        {tile.riverEdges && tile.riverEdges.some((e) => e) && (
          <g className="river-edges">
            {tile.riverEdges.map((hasRiver, idx) =>
              hasRiver ? (
                <polyline
                  key={`river-${idx}`}
                  points={getRiverEdgePoints({ x, y }, idx)}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={5}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              ) : null
            )}
          </g>
        )}

        {/* District indicator with background */}
        {tile.district && (
          <g pointerEvents="none">
            <circle
              cx={x}
              cy={y + (isHills ? -6 : 0)}
              r={HEX_SIZE * 0.38}
              fill="rgba(0, 0, 0, 0.5)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />
            <text
              x={x}
              y={y + (isHills ? -6 : 0)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={HEX_SIZE * 0.55}
            >
              {getDistrictLabel(tile.district)}
            </text>
          </g>
        )}

        {/* Improvement indicator with background (only if no district) */}
        {tile.improvement && !tile.district && (
          <g pointerEvents="none">
            <circle
              cx={x}
              cy={y + (isHills ? -6 : 0)}
              r={HEX_SIZE * 0.32}
              fill="rgba(0, 0, 0, 0.5)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />
            <text
              x={x}
              y={y + (isHills ? -6 : 0)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={HEX_SIZE * 0.45}
            >
              {getImprovementLabel(tile.improvement)}
            </text>
          </g>
        )}

        {/* Feature icon in corner - shown when district/improvement hides the feature graphics */}
        {showFeatureIcon && featureIcon && (
          <g pointerEvents="none">
            <circle
              cx={x - HEX_SIZE * 0.35}
              cy={y + HEX_SIZE * 0.35}
              r={9}
              fill="rgba(0, 0, 0, 0.5)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
            />
            <text
              x={x - HEX_SIZE * 0.35}
              y={y + HEX_SIZE * 0.38}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
            >
              {featureIcon}
            </text>
          </g>
        )}

        {/* City name */}
        {city && (
          <g pointerEvents="none">
            <rect
              x={x - 30}
              y={y + HEX_SIZE * 0.65}
              width={60}
              height={14}
              fill="rgba(0,0,0,0.7)"
              rx={2}
            />
            <text
              x={x}
              y={y + HEX_SIZE * 0.75 + 5}
              textAnchor="middle"
              fontSize={10}
              fill="#fff"
              fontWeight="bold"
            >
              {city.name}
            </text>
          </g>
        )}

        {/* Planned state indicator - always show when there are plans */}
        {hasPlans && (
          <g pointerEvents="none">
            <circle
              cx={x + HEX_SIZE * 0.35}
              cy={y - HEX_SIZE * 0.35}
              r={8}
              fill="#C6A664"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <text
              x={x + HEX_SIZE * 0.35}
              y={y - HEX_SIZE * 0.32}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fill="#0f0f1a"
              fontWeight="bold"
            >
              P
            </text>
          </g>
        )}

        {/* Lock indicator with background */}
        {tile.isLocked && (
          <g pointerEvents="none">
            <circle
              cx={x - HEX_SIZE * 0.35}
              cy={y - HEX_SIZE * 0.35}
              r={9}
              fill="rgba(0, 0, 0, 0.6)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={1}
            />
            <text
              x={x - HEX_SIZE * 0.35}
              y={y - HEX_SIZE * 0.32}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
            >
              🔒
            </text>
          </g>
        )}

        {/* Resource indicator */}
        {tile.resource && (
          <g pointerEvents="none">
            <circle
              cx={x + HEX_SIZE * 0.35}
              cy={y + HEX_SIZE * 0.35}
              r={7}
              fill={getResourceColor(tile.resource.type)}
              stroke="#fff"
              strokeWidth={1.5}
            />
            {/* Small dot if unrevealed */}
            {!tile.resource.revealed && (
              <text
                x={x + HEX_SIZE * 0.35}
                y={y + HEX_SIZE * 0.38}
                textAnchor="middle"
                fontSize={8}
                fill="#fff"
                fontWeight="bold"
              >
                ?
              </text>
            )}
          </g>
        )}
      </g>
    );
  };

  // Render grid lines for empty area (helps with orientation)
  const renderGridGuide = () => {
    const guides: JSX.Element[] = [];
    const range = 10; // Show guides for a 20x20 area around origin

    for (let q = -range; q <= range; q++) {
      for (let r = -range; r <= range; r++) {
        const key = coordKey({ q, r });
        if (tiles.has(key)) continue; // Skip tiles that exist

        const { x, y } = hexToPixel({ q, r });
        const points = hexCorners({ x, y });

        guides.push(
          <polygon
            key={`guide-${key}`}
            points={points}
            fill="none"
            stroke="#374151"
            strokeWidth={0.5}
            strokeDasharray="2,4"
            opacity={0.3}
            className="hex-guide"
          />
        );
      }
    }
    return guides;
  };

  // Calculate adjacency bonuses for overlay mode
  const overlayData = useMemo(() => {
    if (!overlayDistrict) return null;

    const data: Array<{
      coord: HexCoord;
      bonus: number;
      canPlace: boolean;
    }> = [];

    // Calculate for all existing tiles
    tiles.forEach((tile, key) => {
      // Skip tiles that already have districts (except city_center which doesn't count)
      const hasDistrict =
        tile.district !== undefined && tile.district !== "city_center";
      // Skip mountains
      const isMountain = tile.modifier === "mountain";
      // Check water tiles (only harbor can be placed there)
      const isWater = tile.terrain === "coast" || tile.terrain === "ocean";
      const canPlaceOnWater = overlayDistrict === "harbor" && isWater;
      const canPlaceOnLand = !isWater && !isMountain && !hasDistrict;

      const canPlace = canPlaceOnWater || canPlaceOnLand;

      const result = calculateAdjacency(tile.coord, overlayDistrict, tiles, setup.playerCiv);
      data.push({
        coord: tile.coord,
        bonus: result.bonus,
        canPlace,
      });
    });

    return data;
  }, [overlayDistrict, tiles, setup.playerCiv]);

  // Render adjacency overlay badges on tiles
  const renderOverlay = () => {
    if (!overlayData || !overlayDistrict) return null;

    return overlayData.map(({ coord, bonus, canPlace }) => {
      if (!canPlace) return null;

      const { x, y } = hexToPixel(coord);
      const color = getAdjacencyColor(bonus);
      const key = coordKey(coord);

      return (
        <g key={`overlay-${key}`} className="adjacency-overlay" pointerEvents="none">
          {/* Background circle */}
          <circle
            cx={x}
            cy={y}
            r={HEX_SIZE * 0.4}
            fill={color}
            opacity={0.85}
            stroke="#fff"
            strokeWidth={2}
          />
          {/* Bonus text */}
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={HEX_SIZE * 0.4}
            fontWeight="bold"
            fill="#fff"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            +{bonus}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="hex-grid-container">
      <svg
        ref={svgRef}
        className="hex-grid-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Grid guides */}
        <g className="grid-guides">{renderGridGuide()}</g>

        {/* Actual tiles */}
        <g className="tiles">
          {Array.from(tiles.values()).map((tile) => renderHex(tile))}
        </g>

        {/* Adjacency overlay */}
        {overlayDistrict && (
          <g className="adjacency-overlays">{renderOverlay()}</g>
        )}

        {/* Selected tile highlight */}
        {selectedTile && (
          <g className="selection">
            <polygon
              points={hexCorners(hexToPixel(selectedTile))}
              fill="none"
              stroke="#C6A664"
              strokeWidth={3}
              pointerEvents="none"
            />
          </g>
        )}
      </svg>

      {/* Controls hint */}
      <div className="grid-controls-hint glass-panel">
        <span>Scroll to zoom</span>
        <span>Shift+drag or middle-click to pan</span>
        <span>Click to select/add tile</span>
      </div>
    </div>
  );
};

export default HexGrid;
