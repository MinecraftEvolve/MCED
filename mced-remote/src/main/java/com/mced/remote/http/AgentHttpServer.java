package com.mced.remote.http;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.files.FileManager;
import com.mced.remote.http.handlers.*;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class AgentHttpServer {
    private final AgentConfig config;
    private final FileManager fileManager;
    private HttpServer server;

    public AgentHttpServer(AgentConfig config, FileManager fileManager) {
        this.config = config;
        this.fileManager = fileManager;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(config.getPort()), 0);
        AuthMiddleware auth = new AuthMiddleware(config.getApiKey());

        server.createContext("/api/v1/status", new StatusHandler());
        server.createContext("/api/v1/info", new InfoHandler(auth, fileManager));
        server.createContext("/api/v1/files", new FilesHandler(auth, fileManager));
        server.createContext("/api/v1/file", new FileHandler(auth, fileManager));

        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
    }

    public void stop() {
        if (server != null) server.stop(0);
    }
}
