package com.mced.remote.http.handlers;

import com.mced.remote.files.FileManager;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.nio.charset.StandardCharsets;

import static com.mced.remote.http.handlers.StatusHandler.escape;
import static com.mced.remote.http.handlers.StatusHandler.sendJson;

public class FileHandler implements HttpHandler {

    private final AuthMiddleware auth;
    private final FileManager fileManager;

    public FileHandler(AuthMiddleware auth, FileManager fileManager) {
        this.auth = auth;
        this.fileManager = fileManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Handle CORS preflight
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 204, "");
            return;
        }

        if (!auth.authenticate(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();
        String query = exchange.getRequestURI().getQuery();
        String path = getQueryParam(query, "path");

        if (path == null || path.isEmpty()) {
            AuthMiddleware.sendError(exchange, 400, "BAD_REQUEST", "Missing 'path' query parameter");
            return;
        }

        try {
            switch (method) {
                case "GET" -> handleRead(exchange, path);
                case "PUT" -> handleWrite(exchange, path);
                case "DELETE" -> handleDelete(exchange, path);
                default -> sendJson(exchange, 405, "{\"error\":\"METHOD_NOT_ALLOWED\",\"message\":\"Use GET, PUT, or DELETE\"}");
            }
        } catch (SecurityException e) {
            AuthMiddleware.sendError(exchange, 403, "FORBIDDEN", e.getMessage());
        } catch (FileNotFoundException e) {
            AuthMiddleware.sendError(exchange, 404, "NOT_FOUND", e.getMessage());
        } catch (IOException e) {
            AuthMiddleware.sendError(exchange, 500, "INTERNAL_ERROR", e.getMessage());
        }
    }

    private void handleRead(HttpExchange exchange, String path) throws IOException {
        String content = fileManager.readFile(path);
        String body = "{" +
            "\"path\":\"" + escape(path) + "\"," +
            "\"content\":" + toJsonString(content) + "," +
            "\"encoding\":\"UTF-8\"" +
            "}";
        sendJson(exchange, 200, body);
    }

    private void handleWrite(HttpExchange exchange, String path) throws IOException {
        // Read request body
        String content;
        try (InputStream is = exchange.getRequestBody()) {
            content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }

        fileManager.writeFile(path, content);
        sendJson(exchange, 200, "{\"success\":true,\"path\":\"" + escape(path) + "\"}");
    }

    private void handleDelete(HttpExchange exchange, String path) throws IOException {
        fileManager.deleteFile(path);
        sendJson(exchange, 200, "{\"success\":true,\"path\":\"" + escape(path) + "\"}");
    }

    /**
     * Converts a Java string to a valid JSON string literal (with surrounding quotes).
     */
    private String toJsonString(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    private String getQueryParam(String query, String name) {
        if (query == null) return null;
        for (String part : query.split("&")) {
            int eq = part.indexOf('=');
            if (eq > 0) {
                String key = part.substring(0, eq);
                String value = part.substring(eq + 1);
                if (key.equals(name)) {
                    try {
                        return java.net.URLDecoder.decode(value, "UTF-8");
                    } catch (Exception e) {
                        return value;
                    }
                }
            }
        }
        return null;
    }
}
