package com.mced.remote.http.handlers;

import com.mced.remote.config.AgentConfig;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class StatusHandler implements HttpHandler {

    private static final String VERSION = "1.0.0";
    private final AgentConfig config;

    public StatusHandler(AgentConfig config) {
        this.config = config;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"METHOD_NOT_ALLOWED\",\"message\":\"Only GET is allowed\"}");
            return;
        }

        String body = "{" +
            "\"status\":\"ok\"," +
            "\"version\":\"" + VERSION + "\"," +
            "\"serverName\":\"" + escape(config.getServerName()) + "\"" +
            "}";

        sendJson(exchange, 200, body);
    }

    static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "X-API-Key, Content-Type");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
