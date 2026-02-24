// Shared types for Remote Config System (MCED-Remote)

export interface RemoteConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  apiKey: string;
  lastConnected?: number;
}

export interface RemoteFile {
  path: string;
  size: number;
  lastModified: number;
  isDirectory: boolean;
}

export interface RemoteStatus {
  status: "ok" | "error";
  version: string;
  serverName: string;
}

export interface RemoteServerInfo {
  serverName: string;
  rootPath: string;
  serverType: "modded" | "plugin" | "vanilla" | "unknown";
  modLoader: "fabric" | "forge" | "neoforge" | "paper" | "spigot" | "unknown";
  hasConfigDir: boolean;
  hasMods: boolean;
  hasPlugins: boolean;
  javaVersion: string;
  os: string;
}

export type RemoteConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface RemoteErrorCode {
  code: "AUTH_FAILED" | "NOT_FOUND" | "FORBIDDEN" | "CONNECTION_REFUSED" | "TIMEOUT" | "INTERNAL_ERROR" | "UNKNOWN";
  message: string;
}
