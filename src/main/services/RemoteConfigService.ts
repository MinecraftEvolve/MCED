import {
  RemoteConnection,
  RemoteFile,
  RemoteStatus,
  RemoteServerInfo,
  RemoteErrorCode,
} from "../../shared/types/remote.types";

const REQUEST_TIMEOUT_MS = 10_000;

function buildBaseUrl(conn: RemoteConnection): string {
  return `http://${conn.host}:${conn.port}/api/v1`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw makeError("TIMEOUT", "Request timed out after 10 seconds");
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND") || message.includes("fetch failed")) {
      throw makeError("CONNECTION_REFUSED", `Cannot connect to ${url}: ${message}`);
    }
    throw makeError("UNKNOWN", message);
  } finally {
    clearTimeout(timeoutId);
  }
}

function makeError(code: RemoteErrorCode["code"], message: string): Error & { remoteCode: string } {
  const err = new Error(message) as Error & { remoteCode: string };
  err.remoteCode = code;
  return err;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw makeError("INTERNAL_ERROR", `Invalid JSON response: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorCode = (json.error as string) || "UNKNOWN";
    const message = (json.message as string) || `HTTP ${response.status}`;
    if (response.status === 401) throw makeError("AUTH_FAILED", message);
    if (response.status === 403) throw makeError("FORBIDDEN", message);
    if (response.status === 404) throw makeError("NOT_FOUND", message);
    throw makeError(errorCode as RemoteErrorCode["code"], message);
  }

  return json as T;
}

export class RemoteConfigService {
  private connection: RemoteConnection;

  constructor(connection: RemoteConnection) {
    this.connection = connection;
  }

  private headers(): HeadersInit {
    return {
      "X-API-Key": this.connection.apiKey,
      "Content-Type": "text/plain; charset=UTF-8",
    };
  }

  async getStatus(): Promise<RemoteStatus> {
    const url = `${buildBaseUrl(this.connection)}/status`;
    const response = await fetchWithTimeout(url);
    return parseResponse<RemoteStatus>(response);
  }

  async testConnection(): Promise<{ success: boolean; status?: RemoteStatus; error?: string }> {
    try {
      const status = await this.getStatus();
      return { success: true, status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  async getInfo(): Promise<RemoteServerInfo> {
    const url = `${buildBaseUrl(this.connection)}/info`;
    const response = await fetchWithTimeout(url, { headers: this.headers() });
    return parseResponse<RemoteServerInfo>(response);
  }

  async listFiles(path?: string, recursive = false): Promise<RemoteFile[]> {
    let url = `${buildBaseUrl(this.connection)}/files`;
    const params = new URLSearchParams();
    if (path) params.set("path", path);
    if (recursive) params.set("recursive", "true");
    const query = params.toString();
    if (query) url += "?" + query;

    const response = await fetchWithTimeout(url, { headers: this.headers() });
    const data = await parseResponse<{ files: RemoteFile[] }>(response);
    return data.files;
  }

  async readFile(path: string): Promise<string> {
    const url = `${buildBaseUrl(this.connection)}/file?path=${encodeURIComponent(path)}`;
    const response = await fetchWithTimeout(url, { headers: this.headers() });
    const data = await parseResponse<{ content: string }>(response);
    return data.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const url = `${buildBaseUrl(this.connection)}/file?path=${encodeURIComponent(path)}`;
    const response = await fetchWithTimeout(url, {
      method: "PUT",
      headers: this.headers(),
      body: content,
    });
    await parseResponse(response);
  }

  async deleteFile(path: string): Promise<void> {
    const url = `${buildBaseUrl(this.connection)}/file?path=${encodeURIComponent(path)}`;
    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: this.headers(),
    });
    await parseResponse(response);
  }
}
