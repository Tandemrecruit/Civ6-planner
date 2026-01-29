import React, { useState } from "react";
import { useGameStore } from "../store";
import { HexCoord, Tile, coordKey } from "../../types/model";
import HexGrid from "./HexGrid";
import TileInspector from "./TileInspector";
import { CIVS } from "../data/civs";
import "./GameView.css";

interface GameViewProps {
  onNewGame: () => void;
}

const GameView: React.FC<GameViewProps> = ({ onNewGame }) => {
  const { setup, currentTurn, cities, tiles, advanceTurn } = useGameStore();

  const [selectedCoord, setSelectedCoord] = useState<HexCoord | null>(null);
  const [showTurnDialog, setShowTurnDialog] = useState(false);
  const [newTurnInput, setNewTurnInput] = useState("");

  // Get civ and leader names
  const civData = CIVS.find((c) => c.id === setup.playerCiv);
  const leaderData = civData?.leaders.find((l) => l.id === setup.playerLeader);

  const handleTileSelect = (coord: HexCoord, tile: Tile | null) => {
    setSelectedCoord(coord);
  };

  const handleCloseInspector = () => {
    setSelectedCoord(null);
  };

  const handleAdvanceTurn = () => {
    const newTurn = parseInt(newTurnInput, 10);
    if (!isNaN(newTurn) && newTurn > currentTurn) {
      advanceTurn(newTurn);
      setShowTurnDialog(false);
      setNewTurnInput("");
    }
  };

  const handleNewGameClick = () => {
    if (window.confirm("Start a new game? Current progress will be saved as a backup.")) {
      window.electronAPI.backupSave();
      onNewGame();
    }
  };

  const selectedTile = selectedCoord ? tiles.get(coordKey(selectedCoord)) || null : null;

  const victoryIcon: Record<string, string> = {
    science: "🔬",
    culture: "🎭",
    domination: "⚔️",
    religious: "🙏",
    diplomatic: "🤝",
    score: "📊",
  };

  return (
    <div className="game-view">
      {/* Header */}
      <header className="game-header">
        <div className="header-left">
          <div className="civ-info">
            <span className="leader-name">{leaderData?.name || "Unknown"}</span>
            <span className="civ-name">{civData?.name || "Unknown"}</span>
          </div>
          <div className="victory-badge">
            <span className="victory-icon">{victoryIcon[setup.victoryType] || "?"}</span>
            <span>{setup.victoryType}</span>
          </div>
        </div>

        <div className="header-center">
          <button className="turn-display" onClick={() => setShowTurnDialog(true)}>
            <span className="turn-label">Turn</span>
            <span className="turn-number">{currentTurn}</span>
          </button>
        </div>

        <div className="header-right">
          <div className="stat-item">
            <span className="stat-label">Cities</span>
            <span className="stat-value">{cities.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tiles</span>
            <span className="stat-value">{tiles.size}</span>
          </div>
          <button className="new-game-btn" onClick={handleNewGameClick}>
            New Game
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="game-content">
        <HexGrid onTileSelect={handleTileSelect} selectedTile={selectedCoord} />

        {selectedCoord && (
          <TileInspector
            coord={selectedCoord}
            tile={selectedTile}
            onClose={handleCloseInspector}
          />
        )}
      </div>

      {/* Turn advancement dialog */}
      {showTurnDialog && (
        <div className="dialog-overlay" onClick={() => setShowTurnDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Advance Turn</h3>
            <p>Current turn: {currentTurn}</p>
            <div className="dialog-input-group">
              <label>New turn:</label>
              <input
                type="number"
                value={newTurnInput}
                onChange={(e) => setNewTurnInput(e.target.value)}
                min={currentTurn + 1}
                placeholder={String(currentTurn + 1)}
                autoFocus
              />
            </div>
            <div className="dialog-actions">
              <button className="dialog-cancel" onClick={() => setShowTurnDialog(false)}>
                Cancel
              </button>
              <button
                className="dialog-confirm"
                onClick={handleAdvanceTurn}
                disabled={!newTurnInput || parseInt(newTurnInput, 10) <= currentTurn}
              >
                Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
