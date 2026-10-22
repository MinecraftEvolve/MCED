package com.mced.remote.files;

import com.mced.remote.security.PathSanitizer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

public class FileManager {
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    private final PathSanitizer sanitizer;

    public FileManager(String rootPath) {
        this.sanitizer = new PathSanitizer(rootPath);
    }

    public List<Map<String, Object>> listFiles(String dirPath, boolean recursive) throws IOException {
        Path dir = sanitizer.sanitize(dirPath);
        if (!Files.exists(dir)) throw new IOException("Directory not found: " + dirPath);

        List<Map<String, Object>> result = new ArrayList<>();
        try (Stream<Path> stream = recursive
                ? Files.walk(dir, 10)
                : Files.list(dir)) {
            stream.filter(p -> !p.equals(dir)).forEach(p -> {
                try {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    String relPath = sanitizer.getRoot().relativize(p).toString().replace('\\', '/');
                    entry.put("path", relPath);
                    entry.put("isDirectory", Files.isDirectory(p));
                    entry.put("size", Files.isDirectory(p) ? 0 : Files.size(p));
                    entry.put("lastModified", Files.getLastModifiedTime(p).toMillis());
                    result.add(entry);
                } catch (IOException ignored) {}
            });
        }
        return result;
    }

    public String readFile(String filePath) throws IOException {
        Path path = sanitizer.sanitize(filePath);
        if (!Files.exists(path)) throw new IOException("File not found: " + filePath);
        if (Files.isDirectory(path)) throw new IOException("Path is a directory: " + filePath);
        long size = Files.size(path);
        if (size > MAX_FILE_SIZE)
            throw new IOException("File too large (" + size + " bytes, max " + MAX_FILE_SIZE + ")");
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    public void writeFile(String filePath, String content) throws IOException {
        Path path = sanitizer.sanitize(filePath);
        Files.createDirectories(path.getParent());
        Files.writeString(path, content, StandardCharsets.UTF_8);
    }

    public void deleteFile(String filePath) throws IOException {
        Path path = sanitizer.sanitize(filePath);
        if (!Files.exists(path)) throw new IOException("File not found: " + filePath);
        Files.delete(path);
    }

    public PathSanitizer getSanitizer() { return sanitizer; }
}
