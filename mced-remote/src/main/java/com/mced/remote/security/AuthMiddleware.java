package com.mced.remote.security;

import com.sun.net.httpserver.HttpExchange;

public class AuthMiddleware {
    private final String apiKey;

    public AuthMiddleware(String apiKey) {
        this.apiKey = apiKey;
    }

    public boolean authenticate(HttpExchange exchange) {
        String key = exchange.getRequestHeaders().getFirst("X-API-Key");
        return apiKey.equals(key);
    }
}
