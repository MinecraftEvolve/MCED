package com.mced.remote.security;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;

public class PathSanitizer {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini",
        "txt", "xml", "js", "ts", "snbt"
    );

    private final Path rootPath;

    public PathSanitizer(String root) {
        this.rootPath = Paths.get(root).toAbsolutePath().normalize();
    }

    public Path sanitize(String inputPath) throws IOException {
        if (inputPath == null || inputPath.isBlank()) return rootPath;

        Path resolved = rootPath.resolve(inputPath).normalize();
        if (!resolved.startsWith(rootPath)) {
            throw new IOException("Path traversal detected: " + inputPath);
        }

        if (Files.exists(resolved) && !Files.isDirectory(resolved)) {
            String name = resolved.getFileName().toString();
            int dot = name.lastIndexOf('.');
            String ext = dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new IOException("File extension not allowed: " + ext);
            }
        }

        return resolved;
    }

    public Path getRoot() { return rootPath; }
}
