package com.mced.remote.config;

import java.io.*;
import java.nio.file.*;
import java.util.Properties;
import java.util.UUID;

public class AgentConfig {
    private static final String CONFIG_FILE = "mced-remote.properties";
    private static final int DEFAULT_PORT = 25580;

    private int port = DEFAULT_PORT;
    private String apiKey;
    private String rootPath;

    public void load() throws IOException {
        Properties props = new Properties();
        Path configPath = Paths.get(CONFIG_FILE);

        if (Files.exists(configPath)) {
            try (InputStream in = Files.newInputStream(configPath)) {
                props.load(in);
            }
        }

        port = Integer.parseInt(props.getProperty("port", String.valueOf(DEFAULT_PORT)));
        rootPath = props.getProperty("root_path", Paths.get("").toAbsolutePath().toString());

        apiKey = props.getProperty("api_key");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = UUID.randomUUID().toString();
            props.setProperty("api_key", apiKey);
            props.setProperty("port", String.valueOf(port));
            props.setProperty("root_path", rootPath);
            try (OutputStream out = Files.newOutputStream(configPath)) {
                props.store(out, "MCED Remote Agent Configuration\nKeep api_key secret!");
            }
            System.out.println("[MCED-Remote] Generated new API key and saved to " + CONFIG_FILE);
        }
    }

    public int getPort() { return port; }
    public String getApiKey() { return apiKey; }
    public String getRootPath() { return rootPath; }
}
