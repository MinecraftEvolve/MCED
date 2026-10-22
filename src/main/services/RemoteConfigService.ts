import {
  RemoteConnection,
  RemoteFile,
  RemoteServerInfo,
  RemoteStatus,
  RemoteErrorCode,
} from "../../shared/types/remote.types";

const TIMEOUT_MS = 10_000;

function makeError(message: string, code: RemoteErrorCode["code"]): Error {
  const err = new Error(message) as Error & { remoteCode: RemoteErrorCode["code"] };
  err.remoteCode = code;
  return err;
}

function buildBaseUrl(conn: Pick<RemoteConnection, "host" | "port">): string {
  const host = conn.host.startsWith("http") ? conn.host : `http://${conn.host}`;
  return `${host}:${conn.port}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") throw makeError("Request timed out", "TIMEOUT");
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("ECONNREFUSED"))
      throw makeError("Connection refused", "CONNECTION_REFUSED");
    throw makeError(err?.message || "Unknown error", "UNKNOWN");
  } finally {
    clearTimeout(timer);
  }
}

function mapHttpError(status: number, body: string): Error {
  if (status === 401 || status === 403) return makeError("Authentication failed", "AUTH_FAILED");
  if (status === 404) return makeError("Not found", "NOT_FOUND");
  if (status === 403) return makeError("Forbidden", "FORBIDDEN");
  if (status >= 500) return makeError(`Server error: ${body}`, "INTERNAL_ERROR");
  return makeError(`HTTP ${status}: ${body}`, "UNKNOWN");
}

export class RemoteConfigService {
  private connection: RemoteConnection;

  constructor(connection: RemoteConnection) {
    this.connection = connection;
  }

  private get headers(): Record<string, string> {
    return {
      "X-API-Key": this.connection.apiKey,
      "Content-Type": "application/json",
    };
  }

  async getStatus(): Promise<RemoteStatus> {
    const url = `${buildBaseUrl(this.connection)}/api/v1/status`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
    return res.json() as Promise<RemoteStatus>;
  }

  async testConnection(conn: RemoteConnection): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${buildBaseUrl(conn)}/api/v1/status`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Connection failed" };
    }
  }

  async getInfo(): Promise<RemoteServerInfo> {
    const url = `${buildBaseUrl(this.connection)}/api/v1/info`;
    const res = await fetchWithTimeout(url, { headers: this.headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
    return res.json() as Promise<RemoteServerInfo>;
  }

  async listFiles(filePath?: string, recursive = false): Promise<RemoteFile[]> {
    const params = new URLSearchParams();
    if (filePath) params.set("path", filePath);
    if (recursive) params.set("recursive", "true");
    const url = `${buildBaseUrl(this.connection)}/api/v1/files?${params}`;
    const res = await fetchWithTimeout(url, { headers: this.headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
    return res.json() as Promise<RemoteFile[]>;
  }

  async readFile(filePath: string): Promise<string> {
    const params = new URLSearchParams({ path: filePath });
    const url = `${buildBaseUrl(this.connection)}/api/v1/file?${params}`;
    const res = await fetchWithTimeout(url, { headers: this.headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
    return res.text();
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const params = new URLSearchParams({ path: filePath });
    const url = `${buildBaseUrl(this.connection)}/api/v1/file?${params}`;
    const res = await fetchWithTimeout(url, {
      method: "PUT",
      headers: this.headers,
      body: content,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const params = new URLSearchParams({ path: filePath });
    const url = `${buildBaseUrl(this.connection)}/api/v1/file?${params}`;
    const res = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapHttpError(res.status, body);
    }
  }
}
