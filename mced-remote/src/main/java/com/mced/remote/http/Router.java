package com.mced.remote.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.mced.remote.http.handlers.StatusHandler.sendJson;
import static com.mced.remote.security.AuthMiddleware.sendError;

/**
 * Simple path-based router for the embedded HttpServer.
 */
public class Router implements HttpHandler {

    private final Map<String, HttpHandler> routes = new LinkedHashMap<>();

    public void addRoute(String path, HttpHandler handler) {
        routes.put(path, handler);
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();

        // Find matching route (exact or prefix match)
        HttpHandler handler = routes.get(requestPath);
        if (handler == null) {
            // Try prefix match
            for (Map.Entry<String, HttpHandler> entry : routes.entrySet()) {
                if (requestPath.startsWith(entry.getKey())) {
                    handler = entry.getValue();
                    break;
                }
            }
        }

        if (handler != null) {
            try {
                handler.handle(exchange);
            } catch (Exception e) {
                System.err.println("[MCED-Remote] Handler error: " + e.getMessage());
                try {
                    sendError(exchange, 500, "INTERNAL_ERROR", "Unexpected server error");
                } catch (Exception ignored) {}
            }
        } else {
            sendError(exchange, 404, "NOT_FOUND", "No route found for: " + requestPath);
        }
    }
}
