package com.mced.remote.http.handlers;

import com.mced.remote.files.FileManager;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

public class InfoHandler implements HttpHandler {
    private final AuthMiddleware auth;
    private final FileManager fileManager;

    public InfoHandler(AuthMiddleware auth, FileManager fileManager) {
        this.auth = auth;
        this.fileManager = fileManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!auth.authenticate(exchange)) {
            send(exchange, 401, "{\"error\":\"Unauthorized\"}");
            return;
        }
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        Path root = fileManager.getSanitizer().getRoot();
        boolean hasMods = Files.isDirectory(root.resolve("mods"));
        boolean hasConfig = Files.isDirectory(root.resolve("config"));
        boolean hasPlugins = Files.isDirectory(root.resolve("plugins"));

        String serverType = hasMods ? "modded" : hasPlugins ? "plugin" : "vanilla";
        String modLoader = detectModLoader(root);
        String javaVersion = System.getProperty("java.version", "unknown");
        String os = System.getProperty("os.name", "unknown");

        String body = String.format(
            "{\"serverName\":\"%s\",\"rootPath\":\"%s\",\"serverType\":\"%s\"," +
            "\"modLoader\":\"%s\",\"hasConfigDir\":%b,\"hasMods\":%b," +
            "\"hasPlugins\":%b,\"javaVersion\":\"%s\",\"os\":\"%s\"}",
            root.getFileName(), escape(root.toString()), serverType,
            modLoader, hasConfig, hasMods, hasPlugins, javaVersion, escape(os)
        );
        send(exchange, 200, body);
    }

    private String detectModLoader(Path root) {
        if (Files.exists(root.resolve("config/forge")) || Files.exists(root.resolve("META-INF/mods.toml"))) return "forge";
        if (Files.exists(root.resolve("config/fabric")) || Files.exists(root.resolve("fabric.mod.json"))) return "fabric";
        if (Files.exists(root.resolve("config/neoforge"))) return "neoforge";
        if (Files.exists(root.resolve("plugins"))) return "paper";
        return "unknown";
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void send(HttpExchange ex, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(code, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.close();
    }
}
