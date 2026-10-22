package com.mced.remote;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.files.FileManager;
import com.mced.remote.http.AgentHttpServer;

public class MCEDRemote {
    public static void main(String[] args) throws Exception {
        AgentConfig config = new AgentConfig();
        config.load();

        System.out.println("[MCED-Remote] Starting agent v1.0.0");
        System.out.println("[MCED-Remote] Root path : " + config.getRootPath());
        System.out.println("[MCED-Remote] Port      : " + config.getPort());
        System.out.println("[MCED-Remote] API key   : see mced-remote.properties");

        FileManager fileManager = new FileManager(config.getRootPath());
        AgentHttpServer server = new AgentHttpServer(config, fileManager);
        server.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("[MCED-Remote] Shutting down...");
            server.stop();
        }));

        System.out.println("[MCED-Remote] Ready. Listening on port " + config.getPort());
        Thread.currentThread().join();
    }
}
