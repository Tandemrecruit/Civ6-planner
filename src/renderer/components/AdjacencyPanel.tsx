/**
 * @fileoverview Adjacency bonus panel for the TileInspector.
 *
 * This component displays calculated adjacency bonuses for all district types
 * at a given tile coordinate, helping players optimize district placement.
 *
 * @module renderer/components/AdjacencyPanel
 */

import React, { useState, useMemo } from "react";
import { HexCoord, Tile } from "../../types/model";
import {
  calculateAllAdjacencies,
  AdjacencyResult,
  getDistrictDisplayName,
  getAdjacencyColor,
  getAdjacencyRating,
  isWaterDistrict,
} from "../utils/adjacencyCalculator";
import { getDistrictLabel } from "../utils/hexUtils";
import "./AdjacencyPanel.css";

/**
 * Props for the AdjacencyPanel component.
 */
interface AdjacencyPanelProps {
  /** The coordinate to calculate adjacency for */
  coord: HexCoord;
  /** Map of all tiles in the game */
  tiles: Map<string, Tile>;
  /** The tile at the given coordinate (null if empty) */
  tile: Tile | null;
  /** Player civilization for civ-specific bonuses */
  playerCiv?: string;
}

/**
 * Collapsible panel showing district adjacency bonuses for a tile.
 *
 * Features:
 * - Calculates adjacency for all specialty districts
 * - Sorted by bonus value (highest first)
 * - Color-coded ratings (gray/yellow/orange/green)
 * - Expandable breakdown showing individual bonus sources
 * - Only shows if tile can potentially have a district
 *
 * @param props - Component props
 *
 * @example
 * <AdjacencyPanel
 *   coord={{ q: 3, r: -1 }}
 *   tiles={gameStore.tiles}
 *   tile={selectedTile}
 *   playerCiv="korea"
 * />
 */
const AdjacencyPanel: React.FC<AdjacencyPanelProps> = ({ coord, tiles, tile, playerCiv }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  // Calculate adjacency bonuses
  const adjacencyResults = useMemo(() => {
    return calculateAllAdjacencies(coord, tiles, playerCiv);
  }, [coord, tiles, playerCiv]);

  // Filter to only show districts with bonus > 0 or top 5
  const displayResults = useMemo(() => {
    const withBonus = adjacencyResults.filter((r) => r.bonus > 0);
    if (withBonus.length >= 3) {
      return withBonus;
    }
    // If fewer than 3 have bonuses, show top 5 anyway
    return adjacencyResults.slice(0, 5);
  }, [adjacencyResults]);

  // Check if tile already has a district (can't place another)
  const hasExistingDistrict = tile?.district !== undefined;
  // Check if tile is a mountain (can't place districts)
  const isMountain = tile?.modifier === "mountain";
  // Check if tile is water (only water-only districts allowed)
  const isWater = tile?.terrain === "coast" || tile?.terrain === "ocean";

  // Don't show panel for invalid placement locations
  if (isMountain) {
    return null;
  }

  const toggleDistrict = (district: string) => {
    setExpandedDistrict(expandedDistrict === district ? null : district);
  };

  return (
    <div className="adjacency-panel">
      <button className="adjacency-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="adjacency-title">
          <span className="adjacency-icon">📐</span>
          District Adjacency
        </span>
        <span className={`expand-arrow ${isExpanded ? "expanded" : ""}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="adjacency-content">
          {hasExistingDistrict && (
            <p className="adjacency-notice">
              This tile already has a {getDistrictDisplayName(tile!.district!)}.
            </p>
          )}

          {displayResults.length === 0 ? (
            <p className="adjacency-empty">No significant adjacency bonuses.</p>
          ) : (
            <ul className="adjacency-list">
              {displayResults.map((result) => (
                <AdjacencyItem
                  key={result.district}
                  result={result}
                  isExpanded={expandedDistrict === result.district}
                  onToggle={() => toggleDistrict(result.district)}
                  isWater={isWater}
                />
              ))}
            </ul>
          )}

          {!hasExistingDistrict && displayResults.some((r) => r.bonus >= 3) && (
            <p className="adjacency-tip">
              💡 Tiles with +3 or higher adjacency are excellent district locations.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Individual adjacency result item with expandable breakdown.
 */
interface AdjacencyItemProps {
  result: AdjacencyResult;
  isExpanded: boolean;
  onToggle: () => void;
  isWater: boolean;
}

const AdjacencyItem: React.FC<AdjacencyItemProps> = ({ result, isExpanded, onToggle, isWater }) => {
  const { district, bonus, breakdown } = result;
  const color = getAdjacencyColor(bonus);
  const rating = getAdjacencyRating(bonus);
  const icon = getDistrictLabel(district);
  const name = getDistrictDisplayName(district);

  // Water-only districts (e.g. Harbor, Water Park) can be placed on water
  const isValidForTerrain = !isWater || isWaterDistrict(district);

  return (
    <li className={`adjacency-item ${!isValidForTerrain ? "invalid" : ""}`}>
      <button className="adjacency-item-header" onClick={onToggle}>
        <span className="district-icon">{icon}</span>
        <span className="district-name">{name}</span>
        <span className="adjacency-bonus" style={{ color }}>
          +{bonus}
        </span>
        <span className="adjacency-rating" style={{ color }}>
          {rating}
        </span>
        {breakdown.length > 0 && (
          <span className={`breakdown-arrow ${isExpanded ? "expanded" : ""}`}>▸</span>
        )}
      </button>

      {isExpanded && breakdown.length > 0 && (
        <ul className="adjacency-breakdown">
          {breakdown.map((source, idx) => (
            <li key={idx} className="breakdown-item">
              <span className="breakdown-source">{source.source}</span>
              <span className="breakdown-detail">
                {source.count} × {source.bonusPerSource} = +{source.totalBonus}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!isValidForTerrain && <span className="terrain-warning">Cannot place on water</span>}
    </li>
  );
};

export default AdjacencyPanel;
