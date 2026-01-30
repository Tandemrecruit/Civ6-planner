import React, { useState, useEffect } from "react";
import { useGameStore } from "../store";
import {
  HexCoord,
  Tile,
  Terrain,
  TerrainModifier,
  Feature,
  DistrictType,
  Improvement,
  ResourceType,
  StateTrigger,
  TilePlannedState,
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

const RESOURCE_TYPES: ResourceType[] = ["luxury", "strategic", "bonus"];

// Common resources by type
const COMMON_RESOURCES: Record<ResourceType, string[]> = {
  luxury: [
    "Amber", "Citrus", "Cocoa", "Coffee", "Cosmetics", "Cotton", "Diamonds",
    "Dyes", "Furs", "Gypsum", "Incense", "Ivory", "Jade", "Jeans", "Marble",
    "Mercury", "Olives", "Pearls", "Perfume", "Salt", "Silk", "Silver",
    "Spices", "Sugar", "Tea", "Tobacco", "Toys", "Truffles", "Turtles",
    "Whales", "Wine"
  ],
  strategic: [
    "Horses", "Iron", "Niter", "Coal", "Oil", "Aluminum", "Uranium"
  ],
  bonus: [
    "Bananas", "Cattle", "Copper", "Crabs", "Deer", "Fish", "Maize",
    "Rice", "Sheep", "Stone", "Wheat"
  ],
};

const TRIGGER_TYPES = [
  { value: "immediate", label: "Immediate" },
  { value: "tech", label: "At Technology" },
  { value: "civic", label: "At Civic" },
  { value: "turn", label: "At Turn" },
  { value: "population", label: "At Population" },
  { value: "manual", label: "Manual" },
];

const ACTION_TYPES = [
  { value: "place_district", label: "Place District" },
  { value: "improve", label: "Build Improvement" },
  { value: "remove_feature", label: "Remove Feature (Chop)" },
  { value: "harvest_resource", label: "Harvest Resource" },
];

// River edge labels (flat-top hex, starting from right going clockwise)
const RIVER_EDGE_LABELS = ["E", "SE", "SW", "W", "NW", "NE"];

const TileInspector: React.FC<TileInspectorProps> = ({ coord, tile, onClose }) => {
  const { addTile, updateTile, lockTile, addTilePlan, removeTilePlan } = useGameStore();

  // Form state for tile properties
  const [terrain, setTerrain] = useState<Terrain>(tile?.terrain || "grassland");
  const [modifier, setModifier] = useState<TerrainModifier | "none">(
    tile?.modifier || "none"
  );
  const [features, setFeatures] = useState<Feature[]>(tile?.features || []);
  const [district, setDistrict] = useState<DistrictType | "">(tile?.district || "");
  const [improvement, setImprovement] = useState<Improvement | "">(
    tile?.improvement || ""
  );

  // Resource state
  const [hasResource, setHasResource] = useState(!!tile?.resource);
  const [resourceType, setResourceType] = useState<ResourceType>(
    tile?.resource?.type || "bonus"
  );
  const [resourceName, setResourceName] = useState(tile?.resource?.name || "");
  const [resourceRevealed, setResourceRevealed] = useState(
    tile?.resource?.revealed ?? true
  );

  // River edges state
  const [riverEdges, setRiverEdges] = useState<boolean[]>(
    tile?.riverEdges || [false, false, false, false, false, false]
  );

  // Add plan form state
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planTriggerType, setPlanTriggerType] = useState<string>("manual");
  const [planTriggerValue, setPlanTriggerValue] = useState("");
  const [planActionType, setPlanActionType] = useState<string>("place_district");
  const [planActionValue, setPlanActionValue] = useState("");
  const [planRationale, setPlanRationale] = useState("");

  const isNewTile = !tile;

  // Reset form when tile changes
  useEffect(() => {
    if (tile) {
      setTerrain(tile.terrain);
      setModifier(tile.modifier || "none");
      setFeatures(tile.features);
      setDistrict(tile.district || "");
      setImprovement(tile.improvement || "");
      setHasResource(!!tile.resource);
      setResourceType(tile.resource?.type || "bonus");
      setResourceName(tile.resource?.name || "");
      setResourceRevealed(tile.resource?.revealed ?? true);
      setRiverEdges(tile.riverEdges || [false, false, false, false, false, false]);
    } else {
      // Reset to defaults for new tile
      setTerrain("grassland");
      setModifier("none");
      setFeatures([]);
      setDistrict("");
      setImprovement("");
      setHasResource(false);
      setResourceType("bonus");
      setResourceName("");
      setResourceRevealed(true);
      setRiverEdges([false, false, false, false, false, false]);
    }
    setShowAddPlan(false);
  }, [tile, coord]);

  const handleFeatureToggle = (feature: Feature) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleRiverEdgeToggle = (index: number) => {
    setRiverEdges((prev) => {
      const newEdges = [...prev];
      newEdges[index] = !newEdges[index];
      return newEdges;
    });
  };

  const handleSave = () => {
    const resource = hasResource && resourceName
      ? { name: resourceName, type: resourceType, revealed: resourceRevealed }
      : undefined;

    if (isNewTile) {
      addTile({
        coord,
        terrain,
        modifier: modifier === "none" ? undefined : modifier,
        features,
        resource,
        riverEdges,
      });
    } else {
      updateTile(coord, {
        terrain,
        modifier: modifier === "none" ? undefined : modifier,
        features,
        district: district || undefined,
        improvement: improvement || undefined,
        resource,
        riverEdges,
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

    // Build trigger
    let trigger: StateTrigger;
    switch (planTriggerType) {
      case "immediate":
        trigger = { type: "immediate" };
        break;
      case "tech":
        trigger = { type: "tech", techId: planTriggerValue };
        break;
      case "civic":
        trigger = { type: "civic", civicId: planTriggerValue };
        break;
      case "turn":
        trigger = { type: "turn", turn: parseInt(planTriggerValue, 10) || 1 };
        break;
      case "population":
        trigger = { type: "population", cityId: "", pop: parseInt(planTriggerValue, 10) || 1 };
        break;
      default:
        trigger = { type: "manual" };
    }

    // Build action
    let action: TilePlannedState["action"];
    switch (planActionType) {
      case "place_district":
        action = { type: "place_district", district: (planActionValue || "campus") as DistrictType };
        break;
      case "improve":
        action = { type: "improve", improvement: (planActionValue || "farm") as Improvement };
        break;
      case "remove_feature":
        action = { type: "remove_feature" };
        break;
      case "harvest_resource":
        action = { type: "harvest_resource" };
        break;
      default:
        action = { type: "place_district", district: "campus" };
    }

    addTilePlan(coord, {
      trigger,
      action,
      rationale: planRationale || undefined,
    });

    // Reset form
    setShowAddPlan(false);
    setPlanTriggerType("manual");
    setPlanTriggerValue("");
    setPlanActionType("place_district");
    setPlanActionValue("");
    setPlanRationale("");
  };

  const formatLabel = (str: string): string => {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatTrigger = (trigger: StateTrigger): string => {
    switch (trigger.type) {
      case "immediate":
        return "Now";
      case "tech":
        return `At ${formatLabel(trigger.techId)}`;
      case "civic":
        return `At ${formatLabel(trigger.civicId)}`;
      case "turn":
        return `Turn ${trigger.turn}`;
      case "population":
        return `Pop ${trigger.pop}`;
      case "manual":
        return "Manual";
      default:
        return "Unknown";
    }
  };

  const formatAction = (action: TilePlannedState["action"]): string => {
    switch (action.type) {
      case "place_district":
        return `Build ${formatLabel(action.district)}`;
      case "improve":
        return `Build ${formatLabel(action.improvement)}`;
      case "remove_feature":
        return "Chop/Clear";
      case "harvest_resource":
        return "Harvest";
      case "place_wonder":
        return `Build ${action.wonderId}`;
      default:
        return "Unknown";
    }
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

        {/* Rivers */}
        <div className="field-group">
          <label>River Edges</label>
          <div className="river-edge-selector">
            <svg viewBox="-50 -50 100 100" className="river-hex-diagram">
              {/* Hex outline */}
              <polygon
                points="40,0 20,34.6 -20,34.6 -40,0 -20,-34.6 20,-34.6"
                fill="var(--bg-tertiary)"
                stroke="var(--border-color)"
                strokeWidth="2"
              />
              {/* Edge buttons */}
              {RIVER_EDGE_LABELS.map((label, idx) => {
                const angles = [0, 60, 120, 180, 240, 300];
                const angle = angles[idx] * (Math.PI / 180);
                const cx = Math.cos(angle) * 32;
                const cy = Math.sin(angle) * 32;
                const isActive = riverEdges[idx];
                return (
                  <g
                    key={idx}
                    onClick={() => handleRiverEdgeToggle(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill={isActive ? "#3b82f6" : "var(--bg-secondary)"}
                      stroke={isActive ? "#60a5fa" : "var(--border-color)"}
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      fill={isActive ? "#fff" : "var(--text-muted)"}
                      pointerEvents="none"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <span className="river-hint">Click edges to toggle rivers</span>
          </div>
        </div>

        {/* Resources */}
        <div className="field-group">
          <label className="checkbox-item resource-toggle">
            <input
              type="checkbox"
              checked={hasResource}
              onChange={(e) => setHasResource(e.target.checked)}
            />
            <span>Has Resource</span>
          </label>
          {hasResource && (
            <div className="resource-fields">
              <div className="resource-row">
                <select
                  value={resourceType}
                  onChange={(e) => {
                    setResourceType(e.target.value as ResourceType);
                    setResourceName(""); // Reset name when type changes
                  }}
                  className="resource-type-select"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {formatLabel(t)}
                    </option>
                  ))}
                </select>
                <select
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  className="resource-name-select"
                >
                  <option value="">Select...</option>
                  {COMMON_RESOURCES[resourceType].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="checkbox-item revealed-toggle">
                <input
                  type="checkbox"
                  checked={resourceRevealed}
                  onChange={(e) => setResourceRevealed(e.target.checked)}
                />
                <span>Revealed (tech requirement met)</span>
              </label>
            </div>
          )}
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
                      <span className="plan-trigger">{formatTrigger(plan.trigger)}</span>
                      <span className="plan-action">{formatAction(plan.action)}</span>
                      {plan.rationale && (
                        <span className="plan-rationale">{plan.rationale}</span>
                      )}
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

            {/* Add Plan Form */}
            {showAddPlan ? (
              <div className="add-plan-form">
                <div className="field-group">
                  <label>Trigger</label>
                  <select
                    value={planTriggerType}
                    onChange={(e) => setPlanTriggerType(e.target.value)}
                  >
                    {TRIGGER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {(planTriggerType === "tech" || planTriggerType === "civic") && (
                    <input
                      type="text"
                      placeholder={planTriggerType === "tech" ? "e.g., apprenticeship" : "e.g., feudalism"}
                      value={planTriggerValue}
                      onChange={(e) => setPlanTriggerValue(e.target.value)}
                      className="trigger-value-input"
                    />
                  )}
                  {planTriggerType === "turn" && (
                    <input
                      type="number"
                      placeholder="Turn number"
                      value={planTriggerValue}
                      onChange={(e) => setPlanTriggerValue(e.target.value)}
                      min={1}
                      className="trigger-value-input"
                    />
                  )}
                  {planTriggerType === "population" && (
                    <input
                      type="number"
                      placeholder="Population"
                      value={planTriggerValue}
                      onChange={(e) => setPlanTriggerValue(e.target.value)}
                      min={1}
                      className="trigger-value-input"
                    />
                  )}
                </div>

                <div className="field-group">
                  <label>Action</label>
                  <select
                    value={planActionType}
                    onChange={(e) => {
                      setPlanActionType(e.target.value);
                      setPlanActionValue("");
                    }}
                  >
                    {ACTION_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  {planActionType === "place_district" && (
                    <select
                      value={planActionValue}
                      onChange={(e) => setPlanActionValue(e.target.value)}
                      className="action-value-select"
                    >
                      <option value="">Select district...</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {formatLabel(d)}
                        </option>
                      ))}
                    </select>
                  )}
                  {planActionType === "improve" && (
                    <select
                      value={planActionValue}
                      onChange={(e) => setPlanActionValue(e.target.value)}
                      className="action-value-select"
                    >
                      <option value="">Select improvement...</option>
                      {IMPROVEMENTS.map((i) => (
                        <option key={i} value={i}>
                          {formatLabel(i)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="field-group">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="Why this plan?"
                    value={planRationale}
                    onChange={(e) => setPlanRationale(e.target.value)}
                    className="rationale-input"
                  />
                </div>

                <div className="plan-form-actions">
                  <button
                    className="cancel-plan-btn"
                    onClick={() => setShowAddPlan(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="confirm-plan-btn"
                    onClick={handleAddPlan}
                    disabled={
                      (planActionType === "place_district" && !planActionValue) ||
                      (planActionType === "improve" && !planActionValue)
                    }
                  >
                    Add Plan
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-plan-btn" onClick={() => setShowAddPlan(true)}>
                + Add Plan
              </button>
            )}
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
