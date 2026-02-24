package com.mced.remote.files;

import com.mced.remote.config.AgentConfig;
import com.mced.remote.security.PathSanitizer;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;

public class FileManager {

    private final PathSanitizer sanitizer;
    private final long maxFileSizeBytes;

    public FileManager(AgentConfig config, PathSanitizer sanitizer) {
        this.sanitizer = sanitizer;
        this.maxFileSizeBytes = config.getMaxFileSizeBytes();
    }

    public record FileEntry(String path, long size, long lastModified, boolean isDirectory) {}

    /**
     * Lists files in the given path (relative to root).
     * @param relativePath relative path (null or "" for root)
     * @param recursive    if true, recurse into subdirectories
     */
    public List<FileEntry> listFiles(String relativePath, boolean recursive) throws IOException {
        Path dir = sanitizer.resolveSafe(relativePath);

        if (!Files.exists(dir)) {
            throw new FileNotFoundException("Directory not found: " + relativePath);
        }
        if (!Files.isDirectory(dir)) {
            throw new IOException("Path is not a directory: " + relativePath);
        }

        List<FileEntry> result = new ArrayList<>();

        if (recursive) {
            Files.walkFileTree(dir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    String ext = getExtension(file.getFileName().toString());
                    // Only include allowed extensions in recursive listing
                    try {
                        sanitizer.resolveSafe(sanitizer.relativize(file)); // validates extension
                        result.add(new FileEntry(
                            sanitizer.relativize(file),
                            attrs.size(),
                            attrs.lastModifiedTime().toMillis(),
                            false
                        ));
                    } catch (SecurityException | IOException ignored) {
                        // Skip disallowed files silently
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult preVisitDirectory(Path directory, BasicFileAttributes attrs) {
                    if (!directory.equals(dir)) {
                        result.add(new FileEntry(
                            sanitizer.relativize(directory),
                            0,
                            attrs.lastModifiedTime().toMillis(),
                            true
                        ));
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) {
                    return FileVisitResult.CONTINUE;
                }
            });
        } else {
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
                for (Path entry : stream) {
                    BasicFileAttributes attrs = Files.readAttributes(entry, BasicFileAttributes.class);
                    boolean isDir = attrs.isDirectory();

                    if (!isDir) {
                        try {
                            sanitizer.resolveSafe(sanitizer.relativize(entry)); // validates extension
                        } catch (SecurityException ignored) {
                            continue; // Skip disallowed extensions
                        }
                    }

                    result.add(new FileEntry(
                        sanitizer.relativize(entry),
                        isDir ? 0 : attrs.size(),
                        attrs.lastModifiedTime().toMillis(),
                        isDir
                    ));
                }
            }
        }

        result.sort(Comparator
            .comparing((FileEntry e) -> !e.isDirectory()) // directories first
            .thenComparing(FileEntry::path));

        return result;
    }

    /**
     * Reads file content as UTF-8 string.
     */
    public String readFile(String relativePath) throws IOException {
        Path file = sanitizer.resolveSafe(relativePath);

        if (!Files.exists(file)) {
            throw new FileNotFoundException("File not found: " + relativePath);
        }
        if (Files.isDirectory(file)) {
            throw new IOException("Path is a directory: " + relativePath);
        }

        long size = Files.size(file);
        if (size > maxFileSizeBytes) {
            throw new IOException("File too large: " + size + " bytes (max: " + maxFileSizeBytes + ")");
        }

        return Files.readString(file, StandardCharsets.UTF_8);
    }

    /**
     * Writes content to a file (creates parent directories if needed).
     */
    public void writeFile(String relativePath, String content) throws IOException {
        Path file = sanitizer.resolveSafe(relativePath);

        // Create parent directories if needed
        Path parent = file.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }

        Files.writeString(file, content, StandardCharsets.UTF_8);
    }

    /**
     * Deletes a file (not directories).
     */
    public void deleteFile(String relativePath) throws IOException {
        Path file = sanitizer.resolveSafe(relativePath);

        if (!Files.exists(file)) {
            throw new FileNotFoundException("File not found: " + relativePath);
        }
        if (Files.isDirectory(file)) {
            throw new IOException("Cannot delete directories: " + relativePath);
        }

        Files.delete(file);
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
    }
}
