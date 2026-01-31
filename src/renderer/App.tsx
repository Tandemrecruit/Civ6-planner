import React, { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "./store";
import GameSetup from "./components/GameSetup";
import GameView from "./components/GameView";
import { deserialize, serialize } from "./utils/persistence";

type AppView = "loading" | "setup" | "game";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>("loading");
  const { loadState } = useGameStore();

  // Load saved game on startup
  useEffect(() => {
    const loadSavedGame = async () => {
      try {
        const result = await window.electronAPI.loadGame();
        if (result.success && result.data) {
          const parsed = JSON.parse(result.data);
          const state = deserialize(parsed);
          loadState(state);
          setView("game");
        } else {
          setView("setup");
        }
      } catch (error) {
        console.error("Failed to load saved game:", error);
        setView("setup");
      }
    };

    loadSavedGame();
  }, [loadState]);

  // Auto-save when state changes
  // Use shallow selector to only re-render when persistable state changes
  const persistableState = useGameStore(
    useShallow((state) => ({
      setup: state.setup,
      currentTurn: state.currentTurn,
      currentEra: state.currentEra,
      tiles: state.tiles,
      cities: state.cities,
      completedTechs: state.completedTechs,
      completedCivics: state.completedCivics,
      currentTech: state.currentTech,
      currentCivic: state.currentCivic,
      techQueue: state.techQueue,
      civicQueue: state.civicQueue,
      policyLoadout: state.policyLoadout,
      gold: state.gold,
      faith: state.faith,
      strategicResources: state.strategicResources,
      aiCivs: state.aiCivs,
      lastUpdated: state.lastUpdated,
    })),
  );

  useEffect(() => {
    if (view !== "game") return;
    if (!persistableState.setup.playerCiv) return; // Don't save empty state

    const saveTimeout = setTimeout(async () => {
      try {
        const serialized = serialize(persistableState);
        await window.electronAPI.saveGame(JSON.stringify(serialized, null, 2));
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(saveTimeout);
  }, [view, persistableState]);

  const handleStartGame = () => {
    setView("game");
  };

  const handleNewGame = () => {
    setView("setup");
  };

  if (view === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (view === "setup") {
    return <GameSetup onStart={handleStartGame} />;
  }

  return <GameView onNewGame={handleNewGame} />;
};

export default App;
