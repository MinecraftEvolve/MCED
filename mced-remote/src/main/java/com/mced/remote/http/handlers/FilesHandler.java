package com.mced.remote.http.handlers;

import com.mced.remote.files.FileManager;
import com.mced.remote.security.AuthMiddleware;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;

import static com.mced.remote.http.handlers.StatusHandler.escape;
import static com.mced.remote.http.handlers.StatusHandler.sendJson;

public class FilesHandler implements HttpHandler {

    private final AuthMiddleware auth;
    private final FileManager fileManager;

    public FilesHandler(AuthMiddleware auth, FileManager fileManager) {
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

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"METHOD_NOT_ALLOWED\",\"message\":\"Only GET is allowed\"}");
            return;
        }

        // Parse query params
        String query = exchange.getRequestURI().getQuery();
        String path = getQueryParam(query, "path");
        boolean recursive = "true".equalsIgnoreCase(getQueryParam(query, "recursive"));

        try {
            List<FileManager.FileEntry> files = fileManager.listFiles(path, recursive);

            StringBuilder sb = new StringBuilder("{\"files\":[");
            for (int i = 0; i < files.size(); i++) {
                FileManager.FileEntry f = files.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                    .append("\"path\":\"").append(escape(f.path())).append("\",")
                    .append("\"size\":").append(f.size()).append(",")
                    .append("\"lastModified\":").append(f.lastModified()).append(",")
                    .append("\"isDirectory\":").append(f.isDirectory())
                    .append("}");
            }
            sb.append("]}");

            sendJson(exchange, 200, sb.toString());

        } catch (SecurityException e) {
            AuthMiddleware.sendError(exchange, 403, "FORBIDDEN", e.getMessage());
        } catch (java.io.FileNotFoundException e) {
            AuthMiddleware.sendError(exchange, 404, "NOT_FOUND", e.getMessage());
        } catch (IOException e) {
            AuthMiddleware.sendError(exchange, 500, "INTERNAL_ERROR", e.getMessage());
        }
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
