package com.mced.remote.http.handlers;

import com.mced.remote.files.FileManager;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class FilesHandler implements HttpHandler {
    private final AuthMiddleware auth;
    private final FileManager fileManager;

    public FilesHandler(AuthMiddleware auth, FileManager fileManager) {
        this.auth = auth;
        this.fileManager = fileManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!auth.authenticate(exchange)) {
            send(exchange, 401, "{\"error\":\"Unauthorized\"}");
            return;
        }
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        URI uri = exchange.getRequestURI();
        Map<String, String> params = parseQuery(uri.getRawQuery());
        String path = params.get("path");
        boolean recursive = "true".equalsIgnoreCase(params.get("recursive"));

        try {
            List<Map<String, Object>> files = fileManager.listFiles(path, recursive);
            String json = toJsonArray(files);
            send(exchange, 200, json);
        } catch (IOException e) {
            send(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private String toJsonArray(List<Map<String, Object>> files) {
        return "[" + files.stream().map(f -> {
            String path = escapeJson(String.valueOf(f.get("path")));
            boolean isDir = Boolean.TRUE.equals(f.get("isDirectory"));
            long size = ((Number) f.get("size")).longValue();
            long modified = ((Number) f.get("lastModified")).longValue();
            return String.format("{\"path\":\"%s\",\"isDirectory\":%b,\"size\":%d,\"lastModified\":%d}",
                path, isDir, size, modified);
        }).collect(Collectors.joining(",")) + "]";
    }

    private Map<String, String> parseQuery(String query) {
        if (query == null) return Map.of();
        Map<String, String> map = new LinkedHashMap<>();
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                try {
                    map.put(java.net.URLDecoder.decode(kv[0], "UTF-8"),
                            java.net.URLDecoder.decode(kv[1], "UTF-8"));
                } catch (Exception ignored) {}
            }
        }
        return map;
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void send(HttpExchange ex, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(code, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.close();
    }
}
