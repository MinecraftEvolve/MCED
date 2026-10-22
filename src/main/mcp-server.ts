import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomUUID, randomBytes } from "crypto";

type JsonRpc = {
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string };
  id: string | number | null;
};

interface McpTool {
  name: string;
  description: string;
  inputSchema: object;
}

export class MCEDMcpServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sseSessions = new Map<string, ServerResponse>();
  /** Random per-launch bearer token. Clients must send `Authorization: Bearer <token>`. */
  readonly token: string = randomBytes(32).toString("hex");

  // Callbacks wired up from index.ts
  getInstanceData: (() => any) | null = null;
  getMods: (() => any[]) | null = null;
  isRemoteConnected: (() => boolean) | null = null;
  listRemoteFiles: ((path?: string) => Promise<any[]>) | null = null;
  readRemoteFile: ((path: string) => Promise<string>) | null = null;
  writeRemoteFile: ((path: string, content: string) => Promise<void>) | null = null;

  constructor(private port: number) {}

  private tools(): McpTool[] {
    return [
      {
        name: "mced_get_status",
        description:
          "Get MCED status: the currently open Minecraft instance (name, path, version, loader, mod count) and whether a remote server is connected.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "mced_list_mods",
        description:
          "List all mods in the open Minecraft instance. Returns modId, name, version, and config file paths for each mod.",
        inputSchema: {
          type: "object",
          properties: {
            withConfigsOnly: {
              type: "boolean",
              description: "When true, only return mods that have config files",
            },
          },
        },
      },
      {
        name: "mced_list_remote_files",
        description:
          "List config files and directories on the connected remote Minecraft server. Call without path to list the root, or pass a path to list a directory.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path (omit for root)" },
          },
        },
      },
      {
        name: "mced_read_remote_file",
        description:
          "Read the full content of a config file on the connected remote Minecraft server. Works with TOML, JSON, YAML, .properties, and any text format.",
        inputSchema: {
          type: "object",
          properties: { path: { type: "string", description: "File path on the remote server" } },
          required: ["path"],
        },
      },
      {
        name: "mced_write_remote_file",
        description:
          "Write content to a config file on the connected remote Minecraft server. Overwrites the whole file — read it first, then send the modified version.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path on the remote server" },
            content: { type: "string", description: "Full file content to write" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "mced_search_remote_files",
        description:
          "Find config files on the remote server whose path contains the given pattern (case-insensitive substring match).",
        inputSchema: {
          type: "object",
          properties: {
            pattern: { type: "string", description: "Partial filename or path to search for" },
          },
          required: ["pattern"],
        },
      },
    ];
  }

  private async callTool(name: string, args: Record<string, any>): Promise<string> {
    switch (name) {
      case "mced_get_status": {
        const inst = this.getInstanceData?.();
        return JSON.stringify(
          {
            instanceOpen: !!inst,
            instanceName: inst?.name ?? null,
            instancePath: inst?.path ?? null,
            minecraftVersion: inst?.minecraftVersion ?? null,
            modLoader: inst?.loader?.type ?? null,
            modCount: this.getMods?.()?.length ?? 0,
            remoteConnected: this.isRemoteConnected?.() ?? false,
          },
          null,
          2
        );
      }

      case "mced_list_mods": {
        const mods = this.getMods?.() ?? [];
        const out = args.withConfigsOnly
          ? mods.filter((m: any) => (m.configFiles?.length ?? 0) > 0)
          : mods;
        return JSON.stringify(
          out.map((m: any) => ({
            modId: m.modId,
            name: m.name,
            version: m.version,
            configFiles: (m.configFiles ?? []).map((f: any) => f.path ?? f),
            hasConfig: (m.configFiles?.length ?? 0) > 0,
          })),
          null,
          2
        );
      }

      case "mced_list_remote_files": {
        if (!this.isRemoteConnected?.())
          return JSON.stringify({
            error: "No remote server connected. Connect a server via the Remote panel first.",
          });
        const files = await this.listRemoteFiles?.(args.path);
        return JSON.stringify(files ?? [], null, 2);
      }

      case "mced_read_remote_file": {
        if (!this.isRemoteConnected?.()) throw new Error("No remote server connected");
        const content = await this.readRemoteFile?.(args.path as string);
        return content ?? "";
      }

      case "mced_write_remote_file": {
        if (!this.isRemoteConnected?.()) throw new Error("No remote server connected");
        await this.writeRemoteFile?.(args.path as string, args.content as string);
        return `✓ Wrote ${args.path}`;
      }

      case "mced_search_remote_files": {
        if (!this.isRemoteConnected?.())
          return JSON.stringify({ error: "No remote server connected" });
        const all = await this.listRemoteFiles?.();
        const pat = (args.pattern as string).toLowerCase();
        const hits = (all ?? []).filter(
          (f: any) =>
            f.path?.toLowerCase().includes(pat) || f.name?.toLowerCase().includes(pat)
        );
        return JSON.stringify(hits, null, 2);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleJsonRpc(msg: any): Promise<JsonRpc> {
    const { method, params, id } = msg;

    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "mced", version: "1.3.0" },
        },
        id,
      };
    }

    if (method === "notifications/initialized" || method === "ping") {
      return { jsonrpc: "2.0", result: {}, id };
    }

    if (method === "tools/list") {
      return { jsonrpc: "2.0", result: { tools: this.tools() }, id };
    }

    if (method === "tools/call") {
      try {
        const text = await this.callTool(params?.name ?? "", params?.arguments ?? {});
        return { jsonrpc: "2.0", result: { content: [{ type: "text", text }] }, id };
      } catch (e: any) {
        return {
          jsonrpc: "2.0",
          result: {
            content: [{ type: "text", text: `Error: ${e?.message ?? "Unknown error"}` }],
            isError: true,
          },
          id,
        };
      }
    }

    return {
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    };
  }

  async start(): Promise<void> {
    if (this.httpServer?.listening) return;

    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      // ── DNS-rebinding protection ───────────────────────────────────────────
      // Only accept requests where Host is 127.0.0.1 or localhost (+ port).
      const host = (req.headers["host"] ?? "").split(":")[0].toLowerCase();
      if (host !== "127.0.0.1" && host !== "localhost") {
        res.writeHead(421, { "Content-Type": "text/plain" });
        res.end("Misdirected request");
        return;
      }

      // ── CORS: reject any cross-origin request ─────────────────────────────
      const origin = req.headers["origin"];
      if (origin !== undefined) {
        // Electron renderer sends no Origin; only allow null/omitted or file://
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Cross-origin requests not allowed");
        return;
      }

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // ── Bearer token auth (skip for health check) ─────────────────────────
      const isHealthCheck = (req.url === "/" || req.url === "/health") && req.method === "GET";
      if (!isHealthCheck) {
        const auth = req.headers["authorization"] ?? "";
        if (auth !== `Bearer ${this.token}`) {
          res.writeHead(401, { "Content-Type": "text/plain" });
          res.end("Unauthorized — include Authorization: Bearer <token>");
          return;
        }
      }

      // ── Content-Type check on POST bodies ─────────────────────────────────
      if (req.method === "POST") {
        const ct = (req.headers["content-type"] ?? "").toLowerCase();
        if (!ct.includes("application/json")) {
          res.writeHead(415, { "Content-Type": "text/plain" });
          res.end("Content-Type must be application/json");
          return;
        }
      }

      // SSE transport: GET /sse
      if (req.url?.startsWith("/sse") && req.method === "GET") {
        const sessionId = randomUUID();
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        this.sseSessions.set(sessionId, res);
        res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);
        req.on("close", () => this.sseSessions.delete(sessionId));
        return;
      }

      // SSE message handler: POST /message?sessionId=X
      if (req.url?.startsWith("/message") && req.method === "POST") {
        const sessionId = new URL(req.url, `http://localhost`).searchParams.get("sessionId");
        const sseRes = sessionId ? this.sseSessions.get(sessionId) : null;
        let body = "";
        req.on("data", (d) => { body += d.toString(); });
        req.on("end", async () => {
          try {
            const msg = JSON.parse(body);
            const result = await this.handleJsonRpc(msg);
            sseRes?.write(`event: message\ndata: ${JSON.stringify(result)}\n\n`);
            res.writeHead(202);
            res.end();
          } catch {
            res.writeHead(400);
            res.end();
          }
        });
        return;
      }

      // Streamable HTTP: POST /mcp (for direct JSON exchange)
      if (req.url === "/mcp" && req.method === "POST") {
        let body = "";
        req.on("data", (d) => { body += d.toString(); });
        req.on("end", async () => {
          try {
            const msg = JSON.parse(body);
            const result = await this.handleJsonRpc(msg);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32603, message: e?.message },
                id: null,
              })
            );
          }
        });
        return;
      }

      // Health / info
      if (req.url === "/" || req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            name: "MCED MCP Server",
            version: "1.3.0",
            status: "running",
            port: this.port,
            configExample: {
              sse: { type: "sse", url: `http://localhost:${this.port}/sse` },
              http: { type: "http", url: `http://localhost:${this.port}/mcp` },
            },
            tools: this.tools().map((t) => t.name),
          })
        );
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(this.port, "127.0.0.1", resolve);
      this.httpServer!.on("error", reject);
    });
  }

  stop(): void {
    this.sseSessions.clear();
    this.httpServer?.close();
    this.httpServer = null;
  }

  isRunning(): boolean {
    return !!(this.httpServer?.listening);
  }

  getPort(): number {
    return this.port;
  }
}
