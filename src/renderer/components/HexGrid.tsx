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

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

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

    // Check if this tile has a city center
    const city = cities.find(
      (c) => c.location.q === tile.coord.q && c.location.r === tile.coord.r
    );

    // Check for planned states
    const hasPlans = tile.plannedStates.length > 0;

    return (
      <g key={key} className="hex-tile">
        {/* Base terrain */}
        <polygon
          points={points}
          fill={terrainColor}
          stroke={isSelected ? "#fbbf24" : "#374151"}
          strokeWidth={isSelected ? 3 : 1}
          className="hex-polygon"
        />

        {/* Feature overlay */}
        {featureColor && (
          <polygon points={points} fill={featureColor} pointerEvents="none" />
        )}

        {/* District/improvement indicator */}
        {tile.district && (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={HEX_SIZE * 0.6}
            pointerEvents="none"
          >
            {getDistrictLabel(tile.district)}
          </text>
        )}

        {/* City name */}
        {city && (
          <text
            x={x}
            y={y + HEX_SIZE * 0.8}
            textAnchor="middle"
            fontSize={10}
            fill="#fff"
            fontWeight="bold"
            pointerEvents="none"
            style={{ textShadow: "1px 1px 2px #000" }}
          >
            {city.name}
          </text>
        )}

        {/* Planned state indicator */}
        {hasPlans && !tile.district && (
          <circle
            cx={x + HEX_SIZE * 0.5}
            cy={y - HEX_SIZE * 0.5}
            r={6}
            fill="#6366f1"
            stroke="#fff"
            strokeWidth={1}
            pointerEvents="none"
          />
        )}

        {/* Lock indicator */}
        {tile.isLocked && (
          <text
            x={x - HEX_SIZE * 0.5}
            y={y - HEX_SIZE * 0.5}
            fontSize={12}
            pointerEvents="none"
          >
            🔒
          </text>
        )}

        {/* Resource indicator */}
        {tile.resource && (
          <circle
            cx={x}
            cy={y + HEX_SIZE * 0.35}
            r={5}
            fill={
              tile.resource.type === "luxury"
                ? "#a855f7"
                : tile.resource.type === "strategic"
                ? "#ef4444"
                : "#22c55e"
            }
            stroke="#fff"
            strokeWidth={1}
            pointerEvents="none"
          />
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
        onWheel={handleWheel}
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
