import React, { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../store";
import { HexCoord, Tile, coordKey } from "../../types/model";
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
import "./HexGrid.css";

interface HexGridProps {
  onTileSelect: (coord: HexCoord, tile: Tile | null) => void;
  selectedTile: HexCoord | null;
}

const HexGrid: React.FC<HexGridProps> = ({ onTileSelect, selectedTile }) => {
  const { tiles, cities } = useGameStore();
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
      reef: "🐠",
      geothermal: "♨️",
      volcanic_soil: "🌋",
      oasis: "🏝️",
      cliffs: "🪨",
    };

    // Determine what icon to show (priority: district > improvement > feature)
    const hasDistrict = !!tile.district;
    const hasImprovement = !!tile.improvement;
    const primaryFeature = tile.features.length > 0 ? tile.features[0] : null;
    const showFeatureIcon = primaryFeature && !hasDistrict && !hasImprovement && !isMountain;

    return (
      <g key={key} className="hex-tile">
        {/* Base terrain */}
        <polygon
          points={points}
          fill={terrainColor}
          stroke={isSelected ? "#fbbf24" : "#1e293b"}
          strokeWidth={isSelected ? 3 : 1.5}
          className="hex-polygon"
        />

        {/* Feature overlay - different patterns for different features */}
        {featureColor && !isMountain && (
          <polygon points={points} fill={featureColor} pointerEvents="none" />
        )}

        {/* Feature-specific patterns for better differentiation */}
        {primaryFeature === "floodplains" && !isMountain && (
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

        {primaryFeature === "marsh" && !isMountain && (
          <g pointerEvents="none" opacity={0.7}>
            {/* Reed/grass lines for marsh */}
            <line x1={x - 8} y1={y + 10} x2={x - 10} y2={y - 5} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x - 3} y1={y + 10} x2={x - 4} y2={y - 8} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x + 3} y1={y + 10} x2={x + 2} y2={y - 6} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
            <line x1={x + 8} y1={y + 10} x2={x + 10} y2={y - 4} stroke="#365314" strokeWidth={2} strokeLinecap="round" />
          </g>
        )}

        {primaryFeature === "woods" && !isMountain && (
          <g pointerEvents="none">
            {/* Tree symbols for woods */}
            <polygon points={`${x - 10},${y + 8} ${x - 5},${y - 6} ${x},${y + 8}`} fill="#166534" />
            <polygon points={`${x + 2},${y + 8} ${x + 7},${y - 8} ${x + 12},${y + 8}`} fill="#15803d" />
            <rect x={x - 6} y={y + 8} width={2} height={4} fill="#78350f" />
            <rect x={x + 6} y={y + 8} width={2} height={4} fill="#78350f" />
          </g>
        )}

        {primaryFeature === "rainforest" && !isMountain && (
          <g pointerEvents="none">
            {/* Dense tree symbols for rainforest */}
            <polygon points={`${x - 12},${y + 8} ${x - 6},${y - 8} ${x},${y + 8}`} fill="#14532d" />
            <polygon points={`${x - 4},${y + 6} ${x + 2},${y - 10} ${x + 8},${y + 6}`} fill="#166534" />
            <polygon points={`${x + 4},${y + 8} ${x + 10},${y - 6} ${x + 16},${y + 8}`} fill="#15803d" />
            {/* Palm frond accent */}
            <ellipse cx={x + 2} cy={y - 8} rx={4} ry={2} fill="#22c55e" />
          </g>
        )}

        {primaryFeature === "geothermal" && !isMountain && (
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

        {primaryFeature === "oasis" && !isMountain && (
          <g pointerEvents="none">
            {/* Water pool with palm */}
            <ellipse cx={x} cy={y + 4} rx={12} ry={6} fill="#0ea5e9" opacity={0.7} />
            <polygon points={`${x + 8},${y + 6} ${x + 12},${y - 10} ${x + 16},${y + 6}`} fill="#16a34a" />
          </g>
        )}

        {primaryFeature === "reef" && !isMountain && (
          <g pointerEvents="none" opacity={0.8}>
            {/* Coral dots pattern */}
            <circle cx={x - 8} cy={y - 4} r={4} fill="#f472b6" />
            <circle cx={x + 6} cy={y - 2} r={3} fill="#fb923c" />
            <circle cx={x - 2} cy={y + 6} r={4} fill="#a78bfa" />
            <circle cx={x + 10} cy={y + 4} r={3} fill="#4ade80" />
          </g>
        )}

        {primaryFeature === "volcanic_soil" && !isMountain && (
          <g pointerEvents="none" opacity={0.6}>
            {/* Dark soil patches */}
            <ellipse cx={x - 8} cy={y} rx={6} ry={4} fill="#44403c" />
            <ellipse cx={x + 6} cy={y + 4} rx={8} ry={4} fill="#292524" />
            <ellipse cx={x} cy={y - 6} rx={5} ry={3} fill="#44403c" />
          </g>
        )}

        {primaryFeature === "cliffs" && !isMountain && (
          <g pointerEvents="none">
            {/* Rocky cliff face */}
            <polygon points={`${x - 15},${y + 10} ${x - 10},${y - 8} ${x - 5},${y + 10}`} fill="#64748b" />
            <polygon points={`${x - 8},${y + 10} ${x},${y - 10} ${x + 8},${y + 10}`} fill="#475569" />
            <polygon points={`${x + 5},${y + 10} ${x + 12},${y - 6} ${x + 18},${y + 10}`} fill="#64748b" />
          </g>
        )}

        {/* Hills indicator - triangular pattern at bottom */}
        {isHills && (
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
                  stroke="#3b82f6"
                  strokeWidth={4}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              ) : null
            )}
          </g>
        )}

        {/* District indicator */}
        {tile.district && (
          <text
            x={x}
            y={y + (isHills ? -6 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={HEX_SIZE * 0.55}
            pointerEvents="none"
          >
            {getDistrictLabel(tile.district)}
          </text>
        )}

        {/* Improvement indicator (only if no district) */}
        {tile.improvement && !tile.district && (
          <text
            x={x}
            y={y + (isHills ? -6 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={HEX_SIZE * 0.45}
            pointerEvents="none"
          >
            {getImprovementLabel(tile.improvement)}
          </text>
        )}

        {/* Feature label in corner (small, for additional clarity) */}
        {showFeatureIcon && featureIcons[primaryFeature] && (
          <text
            x={x - HEX_SIZE * 0.35}
            y={y + HEX_SIZE * 0.45}
            fontSize={10}
            pointerEvents="none"
          >
            {featureIcons[primaryFeature]}
          </text>
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

        {/* Planned state indicator */}
        {hasPlans && !tile.district && !tile.improvement && (
          <circle
            cx={x + HEX_SIZE * 0.45}
            cy={y - HEX_SIZE * 0.45}
            r={7}
            fill="#6366f1"
            stroke="#fff"
            strokeWidth={1.5}
            pointerEvents="none"
          />
        )}

        {/* Lock indicator */}
        {tile.isLocked && (
          <text
            x={x - HEX_SIZE * 0.45}
            y={y - HEX_SIZE * 0.4}
            fontSize={12}
            pointerEvents="none"
          >
            🔒
          </text>
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

        {/* Selected tile highlight */}
        {selectedTile && (
          <g className="selection">
            <polygon
              points={hexCorners(hexToPixel(selectedTile))}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={3}
              pointerEvents="none"
            />
          </g>
        )}
      </svg>

      {/* Controls hint */}
      <div className="grid-controls-hint">
        <span>Scroll to zoom</span>
        <span>Shift+drag or middle-click to pan</span>
        <span>Click to select/add tile</span>
      </div>
    </div>
  );
};

export default HexGrid;
