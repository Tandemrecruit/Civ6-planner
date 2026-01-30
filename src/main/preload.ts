import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  saveGame: (data: string) => ipcRenderer.invoke("save-game", data),
  loadGame: () => ipcRenderer.invoke("load-game"),
  backupSave: () => ipcRenderer.invoke("backup-save"),
  exportGame: (data: string) => ipcRenderer.invoke("export-game", data),
  importGame: () => ipcRenderer.invoke("import-game"),
  openSaveLocation: () => ipcRenderer.invoke("open-save-location"),
});

// Type declaration for the renderer
export interface ElectronAPI {
  saveGame: (data: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  loadGame: () => Promise<{ success: boolean; data?: string | null; error?: string }>;
  backupSave: () => Promise<{ success: boolean; path?: string; error?: string }>;
  exportGame: (
    data: string
  ) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>;
  importGame: () => Promise<{
    success: boolean;
    canceled?: boolean;
    path?: string;
    data?: string;
    error?: string;
  }>;
  openSaveLocation: () => Promise<{ success: boolean; path?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
