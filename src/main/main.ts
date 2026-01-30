import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import squirrelStartup from "electron-squirrel-startup";
import * as path from "path";
import * as fs from "fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This is only needed for production builds with Squirrel installer
if (squirrelStartup) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Civ 6 Strategic Planner",
    backgroundColor: "#1a1a2e",
  });

  // In development, load from webpack dev server
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

// Get save file path
const getSaveFilePath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "game-state.json");
};

const writeJsonAtomically = (filePath: string, data: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempPath = filePath + ".tmp";
  fs.writeFileSync(tempPath, data, "utf-8");
  fs.renameSync(tempPath, filePath);
};

// IPC handlers for save/load
ipcMain.handle("save-game", async (_event, data: string) => {
  const filePath = getSaveFilePath();

  try {
    writeJsonAtomically(filePath, data);
    return { success: true, path: filePath };
  } catch (error) {
    console.error("Failed to save:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("load-game", async () => {
  const filePath = getSaveFilePath();
  
  if (!fs.existsSync(filePath)) {
    return { success: true, data: null };
  }
  
  try {
    const json = fs.readFileSync(filePath, "utf-8");
    return { success: true, data: json };
  } catch (error) {
    console.error("Failed to load:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("backup-save", async () => {
  const filePath = getSaveFilePath();
  if (!fs.existsSync(filePath)) {
    return { success: true };
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = filePath.replace(".json", `-backup-${timestamp}.json`);
    fs.copyFileSync(filePath, backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("export-game", async (_event, data: string) => {
  try {
    const defaultPath = path.join(
      app.getPath("documents"),
      "Civ6 Strategic Planner",
      "civ6-planner-game.json"
    );

    const result = await dialog.showSaveDialog({
      title: "Save Civ6 Planner File",
      defaultPath,
      filters: [{ name: "Civ6 Planner Save", extensions: ["json"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: true, canceled: true };
    }

    writeJsonAtomically(result.filePath, data);
    return { success: true, canceled: false, path: result.filePath };
  } catch (error) {
    console.error("Failed to export:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("import-game", async () => {
  try {
    const defaultPath = path.join(app.getPath("documents"), "Civ6 Strategic Planner");

    const result = await dialog.showOpenDialog({
      title: "Load Civ6 Planner File",
      defaultPath,
      properties: ["openFile"],
      filters: [{ name: "Civ6 Planner Save", extensions: ["json"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }

    const filePath = result.filePaths[0];
    const json = fs.readFileSync(filePath, "utf-8");
    return { success: true, canceled: false, path: filePath, data: json };
  } catch (error) {
    console.error("Failed to import:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("open-save-location", async () => {
  try {
    const filePath = getSaveFilePath();
    const userDataPath = app.getPath("userData");

    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    } else {
      // Fall back to opening the directory if no save file exists yet
      await shell.openPath(userDataPath);
    }
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Declare these for TypeScript - they're injected by Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
