/**
 * @fileoverview Overlay controls for district adjacency visualization.
 *
 * This component provides controls to toggle and select which district
 * adjacency heatmap to display on the hex grid.
 *
 * @module renderer/components/OverlayControls
 */

import React from "react";
import { DistrictType } from "../../types/model";
import { getDistrictDisplayName } from "../utils/adjacencyCalculator";
import { getDistrictLabel } from "../utils/hexUtils";
import "./OverlayControls.css";

/**
 * Districts that can be selected for adjacency overlay.
 * These are the specialty districts that benefit from adjacency bonuses.
 */
const OVERLAY_DISTRICTS: DistrictType[] = [
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

/**
 * Props for the OverlayControls component.
 */
interface OverlayControlsProps {
  /**
   * Currently selected district for overlay.
   * Pass null when overlay is disabled.
   */
  selectedDistrict: DistrictType | null;

  /**
   * Callback when the selected district changes.
   * Called with null to disable overlay.
   */
  onDistrictChange: (district: DistrictType | null) => void;
}

/**
 * Floating control panel for district adjacency overlay.
 *
 * Features:
 * - Toggle button to enable/disable overlay
 * - Dropdown to select district type when enabled
 * - Color legend showing bonus ratings
 * - Compact design for map corner placement
 *
 * @param props - Component props
 *
 * @example
 * const [overlay, setOverlay] = useState<DistrictType | null>(null);
 *
 * return (
 *   <>
 *     <HexGrid overlayDistrict={overlay} ... />
 *     <OverlayControls
 *       selectedDistrict={overlay}
 *       onDistrictChange={setOverlay}
 *     />
 *   </>
 * );
 */
const OverlayControls: React.FC<OverlayControlsProps> = ({
  selectedDistrict,
  onDistrictChange,
}) => {
  const isEnabled = selectedDistrict !== null;

  const handleToggle = () => {
    if (isEnabled) {
      onDistrictChange(null);
    } else {
      // Default to campus when enabling
      onDistrictChange("campus");
    }
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value as DistrictType;
    onDistrictChange(district);
  };

  return (
    <div className={`overlay-controls glass-panel ${isEnabled ? "enabled" : ""}`}>
      <div className="overlay-header">
        <button
          className={`overlay-toggle ${isEnabled ? "active" : ""}`}
          onClick={handleToggle}
          title={isEnabled ? "Hide adjacency overlay" : "Show adjacency overlay"}
        >
          <span className="toggle-icon">📐</span>
          <span className="toggle-label">Adjacency</span>
          <span className={`toggle-indicator ${isEnabled ? "on" : "off"}`}>
            {isEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {isEnabled && (
        <div className="overlay-body">
          <div className="district-selector">
            <label htmlFor="overlay-district">District:</label>
            <select
              id="overlay-district"
              value={selectedDistrict || ""}
              onChange={handleDistrictSelect}
            >
              {OVERLAY_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {getDistrictLabel(district)} {getDistrictDisplayName(district)}
                </option>
              ))}
            </select>
          </div>

          <div className="overlay-legend">
            <span className="legend-label">Bonus:</span>
            <div className="legend-items">
              <span className="legend-item" style={{ color: "#6b7280" }}>
                <span className="legend-dot" style={{ background: "#6b7280" }} />0
              </span>
              <span className="legend-item" style={{ color: "#eab308" }}>
                <span className="legend-dot" style={{ background: "#eab308" }} />
                1-2
              </span>
              <span className="legend-item" style={{ color: "#f97316" }}>
                <span className="legend-dot" style={{ background: "#f97316" }} />
                3-4
              </span>
              <span className="legend-item" style={{ color: "#22c55e" }}>
                <span className="legend-dot" style={{ background: "#22c55e" }} />
                5+
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayControls;
