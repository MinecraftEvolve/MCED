package com.mced.remote.security;

import com.mced.remote.config.AgentConfig;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class AuthMiddleware {

    private final String apiKey;

    public AuthMiddleware(AgentConfig config) {
        this.apiKey = config.getApiKey();
    }

    /**
     * Returns true if the request has a valid API key.
     * If false, it also writes a 401 response automatically.
     */
    public boolean authenticate(HttpExchange exchange) throws IOException {
        String header = exchange.getRequestHeaders().getFirst("X-API-Key");
        if (header == null || header.isEmpty()) {
            sendError(exchange, 401, "UNAUTHORIZED", "Missing X-API-Key header");
            return false;
        }
        if (!header.equals(apiKey)) {
            sendError(exchange, 401, "UNAUTHORIZED", "Invalid API key");
            return false;
        }
        return true;
    }

    public static void sendError(HttpExchange exchange, int statusCode, String error, String message) throws IOException {
        String body = "{\"error\":\"" + escape(error) + "\",\"message\":\"" + escape(message) + "\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
