package com.mced.remote.security;

import com.mced.remote.config.AgentConfig;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;

public class PathSanitizer {

    private final Path rootPath;
    private final Set<String> allowedExtensions;

    public PathSanitizer(AgentConfig config) throws IOException {
        this.rootPath = Paths.get(config.getRootPath()).toRealPath();
        this.allowedExtensions = config.getAllowedExtensions();
    }

    /**
     * Resolves and validates a user-supplied relative path against the root.
     * Throws SecurityException on path traversal or disallowed extensions.
     */
    public Path resolveSafe(String userPath) throws IOException, SecurityException {
        if (userPath == null || userPath.isEmpty()) {
            return rootPath;
        }

        // Normalize separators and strip leading slashes
        String normalized = userPath.replace('\\', '/').replaceAll("^/+", "");

        Path resolved = rootPath.resolve(normalized).normalize();

        // Check that resolved path is inside rootPath (prevent traversal)
        if (!resolved.startsWith(rootPath)) {
            throw new SecurityException("Path traversal attempt blocked: " + userPath);
        }

        // Check extension (only for files, not directories)
        if (!normalized.isEmpty() && !normalized.endsWith("/")) {
            String filename = resolved.getFileName() != null ? resolved.getFileName().toString() : "";
            int dotIndex = filename.lastIndexOf('.');
            if (dotIndex >= 0) {
                String ext = filename.substring(dotIndex).toLowerCase();
                if (!allowedExtensions.contains(ext)) {
                    throw new SecurityException("File extension not allowed: " + ext);
                }
            } else if (Files.exists(resolved) && !Files.isDirectory(resolved)) {
                // Existing files without extension are not allowed
                throw new SecurityException("Files without extension are not allowed: " + userPath);
            }
        }

        return resolved;
    }

    /**
     * Returns the relative path string from rootPath to the given absolute path.
     */
    public String relativize(Path absolute) {
        return rootPath.relativize(absolute).toString().replace('\\', '/');
    }

    public Path getRootPath() {
        return rootPath;
    }
}
