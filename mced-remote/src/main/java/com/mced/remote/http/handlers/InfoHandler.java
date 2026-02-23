package com.mced.remote.http.handlers;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.security.AuthMiddleware;
import com.mced.remote.security.PathSanitizer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.file.*;

import static com.mced.remote.http.handlers.StatusHandler.escape;
import static com.mced.remote.http.handlers.StatusHandler.sendJson;

public class InfoHandler implements HttpHandler {

    private final AuthMiddleware auth;
    private final AgentConfig config;
    private final PathSanitizer sanitizer;

    public InfoHandler(AuthMiddleware auth, AgentConfig config, PathSanitizer sanitizer) {
        this.auth = auth;
        this.config = config;
        this.sanitizer = sanitizer;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 204, "");
            return;
        }

        if (!auth.authenticate(exchange)) return;

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"METHOD_NOT_ALLOWED\",\"message\":\"Only GET is allowed\"}");
            return;
        }

        Path root = sanitizer.getRootPath();
        String javaVersion = System.getProperty("java.version", "unknown");
        String os = System.getProperty("os.name", "unknown");

        // Detect common Minecraft server directories
        boolean hasConfigDir = Files.isDirectory(root.resolve("config"));
        boolean hasMods = Files.isDirectory(root.resolve("mods"));
        boolean hasPlugins = Files.isDirectory(root.resolve("plugins"));
        boolean hasServerProps = Files.exists(root.resolve("server.properties"));

        String serverType = "unknown";
        if (hasMods && hasConfigDir) serverType = "modded";
        else if (hasPlugins) serverType = "plugin";
        else if (hasServerProps) serverType = "vanilla";

        // Detect mod loader
        String modLoader = "unknown";
        if (Files.exists(root.resolve("fabric-server-launch.jar")) || Files.exists(root.resolve("fabric-server.jar"))) {
            modLoader = "fabric";
        } else if (Files.exists(root.resolve("forge")) || Files.isDirectory(root.resolve("libraries/net/minecraftforge"))) {
            modLoader = "forge";
        } else if (Files.isDirectory(root.resolve("libraries/net/neoforged"))) {
            modLoader = "neoforge";
        } else if (Files.exists(root.resolve("paper.jar")) || Files.exists(root.resolve("purpur.jar"))) {
            modLoader = "paper";
        } else if (Files.exists(root.resolve("spigot.jar"))) {
            modLoader = "spigot";
        }

        String body = "{" +
            "\"serverName\":\"" + escape(config.getServerName()) + "\"," +
            "\"rootPath\":\"" + escape(root.toString()) + "\"," +
            "\"serverType\":\"" + serverType + "\"," +
            "\"modLoader\":\"" + modLoader + "\"," +
            "\"hasConfigDir\":" + hasConfigDir + "," +
            "\"hasMods\":" + hasMods + "," +
            "\"hasPlugins\":" + hasPlugins + "," +
            "\"javaVersion\":\"" + escape(javaVersion) + "\"," +
            "\"os\":\"" + escape(os) + "\"" +
            "}";

        sendJson(exchange, 200, body);
    }
}
