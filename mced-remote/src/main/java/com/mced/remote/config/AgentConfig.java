package com.mced.remote.config;

import java.io.*;
import java.nio.file.*;
import java.util.*;

public class AgentConfig {

    private static final String CONFIG_FILE = "mced-remote.properties";
    private static final String DEFAULT_PORT = "25580";
    private static final String DEFAULT_ROOT_PATH = "./";
    private static final String DEFAULT_EXTENSIONS = ".toml,.json,.json5,.yml,.yaml,.cfg,.properties";
    private static final String DEFAULT_MAX_FILE_SIZE = "10485760";
    private static final String DEFAULT_SERVER_NAME = "My Minecraft Server";

    private final Properties props;

    public AgentConfig() throws IOException {
        this.props = new Properties();
        Path configPath = Paths.get(CONFIG_FILE);

        if (Files.exists(configPath)) {
            try (InputStream in = Files.newInputStream(configPath)) {
                props.load(in);
            }
            System.out.println("[MCED-Remote] Loaded config from " + configPath.toAbsolutePath());
        } else {
            generateDefaults();
            save();
            System.out.println("[MCED-Remote] Created default config at " + configPath.toAbsolutePath());
            System.out.println("[MCED-Remote] Your API Key: " + props.getProperty("server.apiKey"));
        }
    }

    private void generateDefaults() {
        props.setProperty("server.port", DEFAULT_PORT);
        props.setProperty("server.apiKey", UUID.randomUUID().toString());
        props.setProperty("server.rootPath", DEFAULT_ROOT_PATH);
        props.setProperty("server.allowedExtensions", DEFAULT_EXTENSIONS);
        props.setProperty("server.maxFileSizeBytes", DEFAULT_MAX_FILE_SIZE);
        props.setProperty("server.name", DEFAULT_SERVER_NAME);
    }

    private void save() throws IOException {
        try (OutputStream out = Files.newOutputStream(Paths.get(CONFIG_FILE))) {
            props.store(out, "MCED Remote Agent Configuration\n" +
                "# server.port       - Port to listen on (default: 25580)\n" +
                "# server.apiKey     - Secret API key for authentication\n" +
                "# server.rootPath   - Root directory to expose (default: current directory)\n" +
                "# server.allowedExtensions - Comma-separated list of allowed file extensions\n" +
                "# server.maxFileSizeBytes  - Maximum file size in bytes (default: 10MB)\n" +
                "# server.name       - Display name for this server");
        }
    }

    public int getPort() {
        return Integer.parseInt(props.getProperty("server.port", DEFAULT_PORT));
    }

    public String getApiKey() {
        return props.getProperty("server.apiKey", "");
    }

    public String getRootPath() {
        return props.getProperty("server.rootPath", DEFAULT_ROOT_PATH);
    }

    public Set<String> getAllowedExtensions() {
        String[] parts = props.getProperty("server.allowedExtensions", DEFAULT_EXTENSIONS).split(",");
        Set<String> exts = new HashSet<>();
        for (String part : parts) {
            String trimmed = part.trim().toLowerCase();
            if (!trimmed.isEmpty()) {
                exts.add(trimmed);
            }
        }
        return exts;
    }

    public long getMaxFileSizeBytes() {
        return Long.parseLong(props.getProperty("server.maxFileSizeBytes", DEFAULT_MAX_FILE_SIZE));
    }

    public String getServerName() {
        return props.getProperty("server.name", DEFAULT_SERVER_NAME);
    }
}
