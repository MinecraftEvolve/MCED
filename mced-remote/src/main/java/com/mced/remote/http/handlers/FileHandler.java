package com.mced.remote.http.handlers;

import com.mced.remote.files.FileManager;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class FileHandler implements HttpHandler {
    private final AuthMiddleware auth;
    private final FileManager fileManager;

    public FileHandler(AuthMiddleware auth, FileManager fileManager) {
        this.auth = auth;
        this.fileManager = fileManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!auth.authenticate(exchange)) {
            send(exchange, 401, "{\"error\":\"Unauthorized\"}");
            return;
        }

        URI uri = exchange.getRequestURI();
        Map<String, String> params = parseQuery(uri.getRawQuery());
        String filePath = params.get("path");

        if (filePath == null || filePath.isBlank()) {
            send(exchange, 400, "{\"error\":\"Missing path parameter\"}");
            return;
        }

        String method = exchange.getRequestMethod().toUpperCase();
        try {
            switch (method) {
                case "GET" -> {
                    String content = fileManager.readFile(filePath);
                    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
                    exchange.sendResponseHeaders(200, bytes.length);
                    exchange.getResponseBody().write(bytes);
                    exchange.close();
                }
                case "PUT" -> {
                    String content = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    fileManager.writeFile(filePath, content);
                    send(exchange, 200, "{\"success\":true}");
                }
                case "DELETE" -> {
                    fileManager.deleteFile(filePath);
                    send(exchange, 200, "{\"success\":true}");
                }
                default -> send(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        } catch (IOException e) {
            int code = e.getMessage() != null && e.getMessage().contains("not found") ? 404 : 400;
            send(exchange, code, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
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
