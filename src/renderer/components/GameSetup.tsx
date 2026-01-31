/**
 * @fileoverview Game setup screen component for new game configuration.
 *
 * This component provides the initial game setup form where players select
 * their civilization, leader, victory type, game speed, and enabled DLC/modes.
 *
 * @module renderer/components/GameSetup
 */

import React, { useState, useMemo } from "react";
import { useGameStore } from "../store";
import { GameSetup as GameSetupType, VictoryType, GameSpeed } from "../../types/model";
import { CIVS } from "../data/civs";
import "./GameSetup.css";

/**
 * Props for the GameSetup component.
 */
interface GameSetupProps {
  /**
   * Callback fired when the user clicks "Start Planning".
   * Called after the new game is initialized in the store.
   */
  onStart: () => void;
}

/** Victory type options with display labels and icons. */
const VICTORY_TYPES: { value: VictoryType; label: string; icon: string }[] = [
  { value: "science", label: "Science", icon: "🔬" },
  { value: "culture", label: "Culture", icon: "🎭" },
  { value: "domination", label: "Domination", icon: "⚔️" },
  { value: "religious", label: "Religious", icon: "🙏" },
  { value: "diplomatic", label: "Diplomatic", icon: "🤝" },
  { value: "score", label: "Score", icon: "📊" },
];

/** Game speed options with display labels. */
const GAME_SPEEDS: { value: GameSpeed; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "quick", label: "Quick" },
  { value: "standard", label: "Standard" },
  { value: "epic", label: "Epic" },
  { value: "marathon", label: "Marathon" },
];

/**
 * Game setup screen for configuring a new planning session.
 *
 * Displays a form with:
 * - Civilization dropdown with unique ability preview
 * - Leader dropdown (filtered by selected civ) with ability preview
 * - Victory type button grid
 * - Game speed radio buttons
 * - DLC and game mode checkboxes
 *
 * When the user clicks "Start Planning", creates a new game in the store
 * with the selected configuration and calls the onStart callback.
 *
 * @param props - Component props
 * @param props.onStart - Callback to navigate away from setup screen
 *
 * @example
 * const [showSetup, setShowSetup] = useState(true);
 *
 * if (showSetup) {
 *   return <GameSetup onStart={() => setShowSetup(false)} />;
 * }
 * return <GameView />;
 */
const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const { newGame } = useGameStore();

  const [selectedCiv, setSelectedCiv] = useState<string>("");
  const [selectedLeader, setSelectedLeader] = useState<string>("");
  const [victoryType, setVictoryType] = useState<VictoryType>("science");
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>("standard");
  const [dlc, setDlc] = useState({
    gatheringStorm: true,
    riseFall: true,
    dramaticAges: false,
    heroes: false,
    secretSocieties: false,
  });

  const selectedCivData = useMemo(() => CIVS.find((c) => c.id === selectedCiv), [selectedCiv]);

  const handleCivChange = (civId: string) => {
    setSelectedCiv(civId);
    const civ = CIVS.find((c) => c.id === civId);
    if (civ && civ.leaders.length > 0) {
      setSelectedLeader(civ.leaders[0].id);
    } else {
      setSelectedLeader("");
    }
  };

  const handleDlcToggle = (key: keyof typeof dlc) => {
    setDlc((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = () => {
    if (!selectedCiv || !selectedLeader) return;

    const setup: GameSetupType = {
      playerCiv: selectedCiv,
      playerLeader: selectedLeader,
      victoryType,
      gameSpeed,
      dlc,
    };

    newGame(setup);
    onStart();
  };

  const canStart = selectedCiv && selectedLeader;

  return (
    <div className="game-setup">
      <div className="setup-container">
        <h1>New Game</h1>
        <p className="subtitle">Civ 6 Strategic Planner</p>

        <div className="setup-grid">
          {/* Civ Selection */}
          <section className="setup-section">
            <h2>Civilization</h2>
            <select
              value={selectedCiv}
              onChange={(e) => handleCivChange(e.target.value)}
              className="setup-select"
            >
              <option value="">Select a civilization...</option>
              {CIVS.map((civ) => (
                <option key={civ.id} value={civ.id}>
                  {civ.name}
                </option>
              ))}
            </select>

            {selectedCivData && (
              <div className="civ-info">
                <p className="ability-label">Unique Ability:</p>
                <p className="ability-name">{selectedCivData.uniqueAbility}</p>
              </div>
            )}
          </section>

          {/* Leader Selection */}
          <section className="setup-section">
            <h2>Leader</h2>
            <select
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="setup-select"
              disabled={!selectedCiv}
            >
              {!selectedCiv && <option value="">Select a civ first...</option>}
              {selectedCivData?.leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name}
                </option>
              ))}
            </select>

            {selectedCivData && selectedLeader && (
              <div className="civ-info">
                <p className="ability-label">Leader Ability:</p>
                <p className="ability-name">
                  {selectedCivData.leaders.find((l) => l.id === selectedLeader)?.ability}
                </p>
              </div>
            )}
          </section>

          {/* Victory Type */}
          <section className="setup-section">
            <h2>Victory Focus</h2>
            <div className="victory-grid">
              {VICTORY_TYPES.map((v) => (
                <button
                  key={v.value}
                  className={`victory-btn ${victoryType === v.value ? "selected" : ""}`}
                  onClick={() => setVictoryType(v.value)}
                >
                  <span className="victory-icon">{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Game Speed */}
          <section className="setup-section">
            <h2>Game Speed</h2>
            <div className="speed-options">
              {GAME_SPEEDS.map((speed) => (
                <label key={speed.value} className="radio-label">
                  <input
                    type="radio"
                    name="gameSpeed"
                    value={speed.value}
                    checked={gameSpeed === speed.value}
                    onChange={() => setGameSpeed(speed.value)}
                  />
                  <span>{speed.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* DLC & Modes */}
          <section className="setup-section wide">
            <h2>DLC & Game Modes</h2>
            <div className="dlc-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dlc.gatheringStorm}
                  onChange={() => handleDlcToggle("gatheringStorm")}
                />
                <span>Gathering Storm</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dlc.riseFall}
                  onChange={() => handleDlcToggle("riseFall")}
                />
                <span>Rise and Fall</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dlc.dramaticAges}
                  onChange={() => handleDlcToggle("dramaticAges")}
                />
                <span>Dramatic Ages</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dlc.heroes}
                  onChange={() => handleDlcToggle("heroes")}
                />
                <span>Heroes & Legends</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dlc.secretSocieties}
                  onChange={() => handleDlcToggle("secretSocieties")}
                />
                <span>Secret Societies</span>
              </label>
            </div>
          </section>
        </div>

        <button className="start-btn" onClick={handleStart} disabled={!canStart}>
          Start Planning
        </button>
      </div>
    </div>
  );
};

export default GameSetup;
