import React, { useState } from "react";
import { useGameStore } from "../store";
import {
  HexCoord,
  Tile,
  Terrain,
  TerrainModifier,
  Feature,
  DistrictType,
  Improvement,
  coordKey,
} from "../../types/model";
import "./TileInspector.css";

interface TileInspectorProps {
  coord: HexCoord;
  tile: Tile | null;
  onClose: () => void;
}

const TERRAINS: Terrain[] = [
  "grassland",
  "plains",
  "desert",
  "tundra",
  "snow",
  "coast",
  "ocean",
];

const MODIFIERS: (TerrainModifier | "none")[] = ["none", "hills", "mountain"];

const FEATURES: Feature[] = [
  "woods",
  "rainforest",
  "marsh",
  "floodplains",
  "reef",
  "geothermal",
  "volcanic_soil",
  "oasis",
  "cliffs",
];

const DISTRICTS: DistrictType[] = [
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

const IMPROVEMENTS: Improvement[] = [
  "farm",
  "mine",
  "quarry",
  "plantation",
  "camp",
  "pasture",
  "fishing_boats",
  "lumber_mill",
  "oil_well",
  "offshore_platform",
  "seaside_resort",
  "ski_resort",
  "fort",
  "airstrip",
  "missile_silo",
];

const TileInspector: React.FC<TileInspectorProps> = ({ coord, tile, onClose }) => {
  const { addTile, updateTile, lockTile, addTilePlan, removeTilePlan } = useGameStore();

  // Form state for new/editing tile
  const [terrain, setTerrain] = useState<Terrain>(tile?.terrain || "grassland");
  const [modifier, setModifier] = useState<TerrainModifier | "none">(
    tile?.modifier || "none"
  );
  const [features, setFeatures] = useState<Feature[]>(tile?.features || []);
  const [district, setDistrict] = useState<DistrictType | "">(tile?.district || "");
  const [improvement, setImprovement] = useState<Improvement | "">(
    tile?.improvement || ""
  );

  const isNewTile = !tile;

  const handleFeatureToggle = (feature: Feature) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleSave = () => {
    if (isNewTile) {
      addTile({
        coord,
        terrain,
        modifier: modifier === "none" ? undefined : modifier,
        features,
        riverEdges: [false, false, false, false, false, false],
      });
    } else {
      updateTile(coord, {
        terrain,
        modifier: modifier === "none" ? undefined : modifier,
        features,
        district: district || undefined,
        improvement: improvement || undefined,
      });
    }
  };

  const handleLockToggle = () => {
    if (tile) {
      lockTile(coord, !tile.isLocked);
    }
  };

  const handleAddPlan = () => {
    if (!tile) return;

    // For now, just add a simple "immediate" plan
    // In a real implementation, you'd have a form for this
    addTilePlan(coord, {
      trigger: { type: "manual" },
      action: { type: "place_district", district: "campus" },
      rationale: "Planned district",
    });
  };

  const formatLabel = (str: string): string => {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="tile-inspector">
      <div className="inspector-header">
        <h3>
          {isNewTile ? "Add Tile" : "Edit Tile"} ({coord.q}, {coord.r})
        </h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="inspector-content">
        {/* Terrain */}
        <div className="field-group">
          <label>Terrain</label>
          <select value={terrain} onChange={(e) => setTerrain(e.target.value as Terrain)}>
            {TERRAINS.map((t) => (
              <option key={t} value={t}>
                {formatLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {/* Modifier */}
        <div className="field-group">
          <label>Modifier</label>
          <select
            value={modifier}
            onChange={(e) => setModifier(e.target.value as TerrainModifier | "none")}
          >
            {MODIFIERS.map((m) => (
              <option key={m} value={m}>
                {formatLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Features */}
        <div className="field-group">
          <label>Features</label>
          <div className="checkbox-grid">
            {FEATURES.map((f) => (
              <label key={f} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={features.includes(f)}
                  onChange={() => handleFeatureToggle(f)}
                />
                <span>{formatLabel(f)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Current State (only for existing tiles) */}
        {!isNewTile && (
          <>
            <hr />
            <h4>Current State</h4>

            {/* District */}
            <div className="field-group">
              <label>District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as DistrictType | "")}
              >
                <option value="">None</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {formatLabel(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Improvement */}
            <div className="field-group">
              <label>Improvement</label>
              <select
                value={improvement}
                onChange={(e) => setImprovement(e.target.value as Improvement | "")}
              >
                <option value="">None</option>
                {IMPROVEMENTS.map((i) => (
                  <option key={i} value={i}>
                    {formatLabel(i)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Planned States */}
        {!isNewTile && tile && (
          <>
            <hr />
            <h4>Planned States</h4>
            {tile.plannedStates.length === 0 ? (
              <p className="no-plans">No plans for this tile.</p>
            ) : (
              <ul className="plan-list">
                {tile.plannedStates.map((plan) => (
                  <li key={plan.id} className="plan-item">
                    <div className="plan-info">
                      <span className="plan-trigger">
                        {plan.trigger.type === "immediate"
                          ? "Now"
                          : plan.trigger.type === "tech"
                          ? `At ${plan.trigger.techId}`
                          : plan.trigger.type === "civic"
                          ? `At ${plan.trigger.civicId}`
                          : plan.trigger.type === "turn"
                          ? `Turn ${plan.trigger.turn}`
                          : "Manual"}
                      </span>
                      <span className="plan-action">
                        {plan.action.type === "place_district"
                          ? `→ ${formatLabel(plan.action.district)}`
                          : plan.action.type === "improve"
                          ? `→ ${formatLabel(plan.action.improvement)}`
                          : plan.action.type === "remove_feature"
                          ? "→ Remove feature"
                          : "→ Harvest"}
                      </span>
                    </div>
                    <button
                      className="remove-plan-btn"
                      onClick={() => removeTilePlan(coord, plan.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="add-plan-btn" onClick={handleAddPlan}>
              + Add Plan
            </button>
          </>
        )}
      </div>

      <div className="inspector-footer">
        {!isNewTile && tile && (
          <button
            className={`lock-btn ${tile.isLocked ? "locked" : ""}`}
            onClick={handleLockToggle}
          >
            {tile.isLocked ? "🔒 Locked" : "🔓 Unlocked"}
          </button>
        )}
        <button className="save-btn" onClick={handleSave}>
          {isNewTile ? "Add Tile" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default TileInspector;
