package com.mced.remote;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.files.FileManager;
import com.mced.remote.http.AgentHttpServer;
import com.mced.remote.security.PathSanitizer;

import java.io.IOException;

/**
 * MCED Remote Agent - Entry Point
 *
 * A standalone platform-independent HTTP agent that exposes Minecraft server
 * configuration files via a REST API to the MCED desktop application.
 *
 * Usage: java -jar mced-remote.jar
 *
 * On first run, creates mced-remote.properties with a generated API key.
 */
public class MCEDRemote {

    public static void main(String[] args) {
        System.out.println("==============================================");
        System.out.println("  MCED Remote Agent v1.0.0");
        System.out.println("  Minecraft Config Editor - Remote Access");
        System.out.println("==============================================");

        AgentConfig config;
        try {
            config = new AgentConfig();
        } catch (IOException e) {
            System.err.println("[MCED-Remote] Failed to load configuration: " + e.getMessage());
            System.exit(1);
            return;
        }

        PathSanitizer sanitizer;
        try {
            sanitizer = new PathSanitizer(config);
        } catch (IOException e) {
            System.err.println("[MCED-Remote] Invalid root path: " + e.getMessage());
            System.exit(1);
            return;
        }

        System.out.println("[MCED-Remote] Root path: " + sanitizer.getRootPath());
        System.out.println("[MCED-Remote] API Key:   " + config.getApiKey());

        FileManager fileManager = new FileManager(config, sanitizer);

        AgentHttpServer httpServer;
        try {
            httpServer = new AgentHttpServer(config, sanitizer, fileManager);
        } catch (IOException e) {
            System.err.println("[MCED-Remote] Failed to start HTTP server on port " + config.getPort() + ": " + e.getMessage());
            System.exit(1);
            return;
        }

        httpServer.start();

        // Graceful shutdown on SIGTERM / SIGINT
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[MCED-Remote] Shutting down...");
            httpServer.stop();
        }));

        System.out.println("[MCED-Remote] Ready. Press Ctrl+C to stop.");
        System.out.println("----------------------------------------------");
        System.out.println("  Connect from MCED Desktop:");
        System.out.println("  Host:    <your-server-ip>");
        System.out.println("  Port:    " + config.getPort());
        System.out.println("  API Key: " + config.getApiKey());
        System.out.println("----------------------------------------------");

        // Keep alive
        try {
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
