package com.mced.remote.http;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.files.FileManager;
import com.mced.remote.http.handlers.*;
import com.mced.remote.security.AuthMiddleware;
import com.mced.remote.security.PathSanitizer;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class AgentHttpServer {

    private final HttpServer server;
    private final int port;

    public AgentHttpServer(AgentConfig config, PathSanitizer sanitizer, FileManager fileManager) throws IOException {
        this.port = config.getPort();

        AuthMiddleware auth = new AuthMiddleware(config);

        // Create server
        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newFixedThreadPool(4));

        // Build router
        Router router = new Router();
        router.addRoute("/api/v1/status", new StatusHandler(config));
        router.addRoute("/api/v1/files",  new FilesHandler(auth, fileManager));
        router.addRoute("/api/v1/file",   new FileHandler(auth, fileManager));
        router.addRoute("/api/v1/info",   new InfoHandler(auth, config, sanitizer));

        server.createContext("/", router);
    }

    public void start() {
        server.start();
        System.out.println("[MCED-Remote] Server running on port " + port);
        System.out.println("[MCED-Remote] Status: http://localhost:" + port + "/api/v1/status");
    }

    public void stop() {
        server.stop(1);
        System.out.println("[MCED-Remote] Server stopped.");
    }
}
