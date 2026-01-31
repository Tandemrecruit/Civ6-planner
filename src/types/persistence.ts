import { GameState, SerializedGameState, CURRENT_SCHEMA_VERSION } from "./model";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

/** Get the save file path (in user data directory) */
export const getSaveFilePath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "game-state.json");
};

/** Convert GameState to serializable format */
export const serialize = (state: GameState): SerializedGameState => {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    setup: state.setup,
    currentTurn: state.currentTurn,
    currentEra: state.currentEra,
    tiles: Array.from(state.tiles.entries()),
    cities: state.cities,
    completedTechs: Array.from(state.completedTechs),
    completedCivics: Array.from(state.completedCivics),
    currentTech: state.currentTech,
    currentCivic: state.currentCivic,
    techQueue: state.techQueue,
    civicQueue: state.civicQueue,
    policyLoadout: state.policyLoadout,
    gold: state.gold,
    faith: state.faith,
    strategicResources: Array.from(state.strategicResources.entries()),
    aiCivs: state.aiCivs,
    lastUpdated: state.lastUpdated.toISOString(),
  };
};

/** Convert serialized format back to GameState */
export const deserialize = (data: SerializedGameState): GameState => {
  // Handle schema migrations here as needed
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `Schema version mismatch: file is v${data.schemaVersion}, current is v${CURRENT_SCHEMA_VERSION}`,
    );
    // Add migration logic here when schema changes
  }

  return {
    setup: data.setup,
    currentTurn: data.currentTurn,
    currentEra: data.currentEra,
    tiles: new Map(data.tiles),
    cities: data.cities,
    completedTechs: new Set(data.completedTechs),
    completedCivics: new Set(data.completedCivics),
    currentTech: data.currentTech,
    currentCivic: data.currentCivic,
    techQueue: data.techQueue,
    civicQueue: data.civicQueue,
    policyLoadout: data.policyLoadout,
    gold: data.gold,
    faith: data.faith,
    strategicResources: new Map(data.strategicResources),
    aiCivs: data.aiCivs,
    lastUpdated: new Date(data.lastUpdated),
  };
};

/** Save game state to file */
export const saveGame = (state: GameState): void => {
  const filePath = getSaveFilePath();
  const serialized = serialize(state);
  const json = JSON.stringify(serialized, null, 2);

  // Write to temp file first, then rename (atomic write)
  const tempPath = filePath + ".tmp";
  fs.writeFileSync(tempPath, json, "utf-8");
  fs.renameSync(tempPath, filePath);

  console.log(`Game saved to ${filePath}`);
};

/** Load game state from file, returns null if no save exists */
export const loadGame = (): GameState | null => {
  const filePath = getSaveFilePath();

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const json = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(json) as SerializedGameState;
    return deserialize(data);
  } catch (error) {
    console.error("Failed to load game:", error);
    return null;
  }
};

/** Create a backup of current save */
export const backupSave = (): void => {
  const filePath = getSaveFilePath();
  if (!fs.existsSync(filePath)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = filePath.replace(".json", `-backup-${timestamp}.json`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup created: ${backupPath}`);
};

/** Delete current save (for "new game") */
export const deleteSave = (): void => {
  const filePath = getSaveFilePath();
  if (fs.existsSync(filePath)) {
    // Backup before deleting
    backupSave();
    fs.unlinkSync(filePath);
  }
};
